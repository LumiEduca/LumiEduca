import request from "supertest";
import { jest } from "@jest/globals";
import { prisma, limparDados } from "./helpers/db.js";

// MOCK do Lumi (NUNCA chama a API real). Tem que vir antes de importar o app.
jest.unstable_mockModule("../services/lumiService.js", () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: "ok" }),
  gerarQuestoes: jest.fn(),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import("../app.js");
const lumiService = await import("../services/lumiService.js");

const questoesMock = {
  questoes: [
    {
      enunciado: "Quanto é 1/2 + 1/2?",
      opcoes: ["1", "2", "1/4"],
      respostaCorreta: 0,
    },
  ],
};

const erroGemini = (status) =>
  Object.assign(new Error("detalhe interno do Google"), { statusHttp: status });

describe("POST /api/v1/lumi/gerar-questoes", () => {
  let tokenProfessor, tokenAluno;

  const corpoValido = () => ({
    tema: "Frações",
    materia: "Matemática",
    quantidade: 2,
    nivel: "facil",
  });

  const criarUser = async (tipo, sufixo) => {
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

  beforeAll(async () => {
    await limparDados();
    tokenProfessor = await criarUser("professor", "gq");
    tokenAluno = await criarUser("aluno", "gq");
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    lumiService.gerarQuestoes.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  const chamar = (token, corpo) => {
    const req = request(app).post("/api/v1/lumi/gerar-questoes");
    if (token) req.set("Authorization", `Bearer ${token}`);
    return req.send(corpo);
  };

  it("200: professor recebe as questões geradas e o serviço recebe os dados validados", async () => {
    lumiService.gerarQuestoes.mockResolvedValueOnce(questoesMock);

    const res = await chamar(tokenProfessor, corpoValido());

    expect(res.status).toBe(200);
    expect(res.body).toEqual(questoesMock);
    expect(lumiService.gerarQuestoes).toHaveBeenCalledWith(corpoValido());
  });

  it("401: sem token", async () => {
    const res = await chamar(null, corpoValido());
    expect(res.status).toBe(401);
    expect(lumiService.gerarQuestoes).not.toHaveBeenCalled();
  });

  it("403: aluno não pode gerar questões", async () => {
    const res = await chamar(tokenAluno, corpoValido());
    expect(res.status).toBe(403);
    expect(res.body.erro).toBe("Apenas professor pode acessar esta rota");
    expect(lumiService.gerarQuestoes).not.toHaveBeenCalled();
  });

  describe("400: validação", () => {
    it("corpo vazio", async () => {
      const res = await chamar(tokenProfessor, {});
      expect(res.status).toBe(400);
    });

    it("quantidade acima do limite (10)", async () => {
      const res = await chamar(tokenProfessor, {
        ...corpoValido(),
        quantidade: 99,
      });
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("O campo 'quantidade' deve ser no máximo 10.");
    });

    it("quantidade zero", async () => {
      const res = await chamar(tokenProfessor, {
        ...corpoValido(),
        quantidade: 0,
      });
      expect(res.status).toBe(400);
    });

    it("nível inválido", async () => {
      const res = await chamar(tokenProfessor, {
        ...corpoValido(),
        nivel: "impossivel",
      });
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe(
        "O campo 'nivel' deve ser 'facil', 'medio' ou 'dificil'.",
      );
    });

    it("tema com mais de 200 caracteres", async () => {
      const res = await chamar(tokenProfessor, {
        ...corpoValido(),
        tema: "A".repeat(201),
      });
      expect(res.status).toBe(400);
    });
  });

  it("502: Gemini devolveu JSON inválido ou fora do formato (mensagem genérica, sem vazar detalhe)", async () => {
    lumiService.gerarQuestoes.mockRejectedValueOnce(erroGemini(502));

    const res = await chamar(tokenProfessor, corpoValido());

    expect(res.status).toBe(502);
    expect(res.body.erro).toBe(
      "Não foi possível gerar as questões agora. Tente novamente em instantes.",
    );
    expect(JSON.stringify(res.body)).not.toContain("Google");
  });

  it("503: Gemini fora do ar, lento ou sobrecarregado", async () => {
    lumiService.gerarQuestoes.mockRejectedValueOnce(erroGemini(503));

    const res = await chamar(tokenProfessor, corpoValido());

    expect(res.status).toBe(503);
    expect(res.body.erro).toBe(
      "Não foi possível gerar as questões agora. Tente novamente em instantes.",
    );
  });

  it("503: erro inesperado (Error comum) também vira 503 genérico", async () => {
    lumiService.gerarQuestoes.mockRejectedValueOnce(
      new Error("qualquer coisa"),
    );

    const res = await chamar(tokenProfessor, corpoValido());

    expect(res.status).toBe(503);
  });
});
