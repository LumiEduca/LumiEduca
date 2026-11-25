import request from "supertest";
import { jest } from "@jest/globals";
import { prisma, limparDados } from "./helpers/db.js";

// MOCK só do Gemini (NUNCA chama a API real). O banco é real.
jest.unstable_mockModule("../services/lumiService.js", () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: "ok" }),
  gerarQuestoes: jest.fn(),
  explicarErro: jest.fn(),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import("../app.js");
const lumiService = await import("../services/lumiService.js");

const erroGemini = (status) =>
  Object.assign(new Error("detalhe interno do Google"), { statusHttp: status });

describe("POST /api/v1/lumi/explicar-erro", () => {
  let tokenProf, tokenAluno, tokenAlunoSemResposta, tokenAlunoFora;
  let questaoId, outraQuestaoId;

  const registrar = async (tipo, sufixo) => {
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post(`/api/v1/auth/register/${tipo}`)
      .send({
        nome: `User ${sufixo}`,
        usuario: `${tipo.substring(0, 4)}_${sufixo}_${hash}`,
        senha: "password123",
      });
    if (res.status !== 201)
      throw new Error(`Falha no setup (${tipo}): ${JSON.stringify(res.body)}`);
    return res.body.token;
  };

  const auth = (token) => ({ Authorization: `Bearer ${token}` });
  const chamar = (token, corpo) => {
    const req = request(app).post("/api/v1/lumi/explicar-erro");
    if (token) req.set(auth(token));
    return req.send(corpo);
  };
  const responder = (token, qid, resposta) =>
    request(app)
      .post("/api/v1/progresso/responder")
      .set(auth(token))
      .send({ questaoId: qid, resposta });

  beforeAll(async () => {
    await limparDados();

    tokenProf = await registrar("professor", "ee");
    tokenAluno = await registrar("aluno", "ee");
    tokenAlunoSemResposta = await registrar("aluno", "ee2");
    tokenAlunoFora = await registrar("aluno", "ee3");

    const sala = await request(app)
      .post("/api/v1/salas")
      .set(auth(tokenProf))
      .send({ nome: "Sala EE" });
    for (const t of [tokenAluno, tokenAlunoSemResposta]) {
      await request(app)
        .post("/api/v1/salas/entrar")
        .set(auth(t))
        .send({ codigo: sala.body.codigo });
    }

    const atividade = await request(app)
      .post("/api/v1/atividades")
      .set(auth(tokenProf))
      .send({
        titulo: "Frações",
        materia: "Matemática",
        questoes: [
          {
            enunciado: "Quanto é 1/2 + 1/2?",
            opcoes: ["1", "2", "1/4"],
            respostaCorreta: 0,
          },
          {
            enunciado: "Quanto é 1 + 1?",
            opcoes: ["1", "2", "3"],
            respostaCorreta: 1,
          },
        ],
      });
    if (atividade.status !== 201)
      throw new Error(
        `Falha ao criar atividade: ${JSON.stringify(atividade.body)}`,
      );

    // Vínculo atividade-sala direto no banco, para não depender de rota que não vimos
    await prisma.salaAtividade.upsert({
      where: {
        salaId_atividadeId: {
          salaId: sala.body.id,
          atividadeId: atividade.body.id,
        },
      },
      update: {},
      create: { salaId: sala.body.id, atividadeId: atividade.body.id },
    });

    [questaoId, outraQuestaoId] = atividade.body.questoes.map((q) => q.id);

    // tokenAluno ERRA a primeira questão (marca a opção 2; a correta é a 0)
    const r = await responder(tokenAluno, questaoId, 2);
    if (r.status !== 201)
      throw new Error(`Falha ao responder: ${JSON.stringify(r.body)}`);
    // tokenAluno ACERTA a segunda questão
    const r2 = await responder(tokenAluno, outraQuestaoId, 1);
    if (r2.status !== 201)
      throw new Error(`Falha ao responder: ${JSON.stringify(r2.body)}`);
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    lumiService.explicarErro.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("200: aluno que errou recebe a explicação, e o Gemini recebe as opções como texto", async () => {
    lumiService.explicarErro.mockResolvedValueOnce({ explicacao: "Quase! 🦊" });

    const res = await chamar(tokenAluno, { questaoId, resposta: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ acertou: false, explicacao: "Quase! 🦊" });
    expect(lumiService.explicarErro).toHaveBeenCalledWith({
      enunciado: "Quanto é 1/2 + 1/2?",
      tipo: "MULTIPLA_ESCOLHA",
      opcoes: ["1", "2", "1/4"],
      respostaAluno: "1/4",
      respostaCorreta: "1",
    });
  });

  it("200: aluno que acertou recebe parabéns SEM chamar o Gemini", async () => {
    const res = await chamar(tokenAluno, {
      questaoId: outraQuestaoId,
      resposta: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.acertou).toBe(true);
    expect(lumiService.explicarErro).not.toHaveBeenCalled();
  });

  it("403: aluno que ainda NÃO respondeu a questão não recebe a explicação", async () => {
    const res = await chamar(tokenAlunoSemResposta, { questaoId, resposta: 0 });

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("1/2 + 1/2");
    expect(lumiService.explicarErro).not.toHaveBeenCalled();
  });

  it("403: aluno de fora da sala também não recebe", async () => {
    const res = await chamar(tokenAlunoFora, { questaoId, resposta: 0 });

    expect(res.status).toBe(403);
    expect(lumiService.explicarErro).not.toHaveBeenCalled();
  });

  it("400: resposta do corpo diferente da que o aluno gravou", async () => {
    const res = await chamar(tokenAluno, { questaoId, resposta: 0 });

    expect(res.status).toBe(400);
    expect(lumiService.explicarErro).not.toHaveBeenCalled();
  });

  it("404: questão inexistente", async () => {
    const res = await chamar(tokenAluno, {
      questaoId: "nao-existe-123",
      resposta: 0,
    });

    expect(res.status).toBe(404);
  });

  it("401: sem token", async () => {
    const res = await chamar(null, { questaoId, resposta: 2 });

    expect(res.status).toBe(401);
  });

  it("403: professor não pode usar a rota", async () => {
    const res = await chamar(tokenProf, { questaoId, resposta: 2 });

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe("Apenas aluno pode acessar esta rota");
  });

  describe("400: validação do corpo", () => {
    it("corpo vazio", async () => {
      expect((await chamar(tokenAluno, {})).status).toBe(400);
    });

    it("questaoId com caracteres inválidos", async () => {
      expect(
        (await chamar(tokenAluno, { questaoId: "a b/c", resposta: 0 })).status,
      ).toBe(400);
    });

    it("sem resposta", async () => {
      expect((await chamar(tokenAluno, { questaoId })).status).toBe(400);
    });
  });

  it("502: Gemini devolveu algo inutilizável (mensagem genérica, sem vazar detalhe)", async () => {
    lumiService.explicarErro.mockRejectedValueOnce(erroGemini(502));

    const res = await chamar(tokenAluno, { questaoId, resposta: 2 });

    expect(res.status).toBe(502);
    expect(res.body.erro).toBe(
      "O Lumi não conseguiu explicar agora. Tente novamente em instantes.",
    );
    expect(JSON.stringify(res.body)).not.toContain("Google");
  });

  it("503: Gemini fora do ar, lento ou sobrecarregado", async () => {
    lumiService.explicarErro.mockRejectedValueOnce(erroGemini(503));

    const res = await chamar(tokenAluno, { questaoId, resposta: 2 });

    expect(res.status).toBe(503);
  });
});
