import request from "supertest";
import { jest } from "@jest/globals";
import { prisma, limparDados } from "./helpers/db.js";

// MOCK só do Gemini (NUNCA chama a API real). O banco é real.
jest.unstable_mockModule("../services/lumiService.js", () => ({
  gerarDica: jest.fn(),
  gerarQuestoes: jest.fn(),
  explicarErro: jest.fn(),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import("../app.js");
const lumiService = await import("../services/lumiService.js");

describe("Histórico de dicas do Lumi", () => {
  let tokenAluno, tokenOutroAluno, tokenProf;

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

  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    await limparDados();
    tokenAluno = await registrar("aluno", "hist");
    tokenOutroAluno = await registrar("aluno", "hist2");
    tokenProf = await registrar("professor", "hist");
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    lumiService.gerarDica.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  const pedirDica = (token, pergunta) =>
    request(app).post("/api/v1/lumi/dica").set(auth(token)).send({ pergunta });

  it("dica bem-sucedida entra no histórico do aluno", async () => {
    lumiService.gerarDica.mockResolvedValueOnce({
      dica: "Pense em metades 🦊",
    });

    const res = await pedirDica(tokenAluno, "Como somar frações?");
    expect(res.status).toBe(200);

    const hist = await request(app)
      .get("/api/v1/lumi/historico")
      .set(auth(tokenAluno));
    expect(hist.status).toBe(200);
    expect(hist.body.dicas).toHaveLength(1);
    expect(hist.body.dicas[0]).toMatchObject({
      pergunta: "Como somar frações?",
      resposta: "Pense em metades 🦊",
    });
  });

  it("dica que falhou (503) NÃO entra no histórico", async () => {
    lumiService.gerarDica.mockRejectedValueOnce(
      Object.assign(new Error("x"), { statusHttp: 503 }),
    );

    const res = await pedirDica(tokenAluno, "Pergunta que falha");
    expect(res.status).toBe(503);

    const hist = await request(app)
      .get("/api/v1/lumi/historico")
      .set(auth(tokenAluno));
    expect(
      hist.body.dicas.some((d) => d.pergunta === "Pergunta que falha"),
    ).toBe(false);
  });

  it("aluno só vê as próprias dicas", async () => {
    const hist = await request(app)
      .get("/api/v1/lumi/historico")
      .set(auth(tokenOutroAluno));
    expect(hist.status).toBe(200);
    expect(hist.body.dicas).toEqual([]);
  });

  it("401 sem token e 403 para professor", async () => {
    expect((await request(app).get("/api/v1/lumi/historico")).status).toBe(401);
    expect(
      (await request(app).get("/api/v1/lumi/historico").set(auth(tokenProf)))
        .status,
    ).toBe(403);
  });

  it("400 para limite inválido (0, 99 ou texto)", async () => {
    for (const limite of ["0", "99", "abc"]) {
      const res = await request(app)
        .get(`/api/v1/lumi/historico?limite=${limite}`)
        .set(auth(tokenAluno));
      expect(res.status).toBe(400);
    }
  });

  it("professor pode pedir dica e nada é gravado para ele", async () => {
    lumiService.gerarDica.mockResolvedValueOnce({ dica: "ok" });

    const res = await pedirDica(tokenProf, "Pergunta do professor");
    expect(res.status).toBe(200);
    expect(
      await prisma.lumiDica.count({ where: { aluno: { tipo: "PROFESSOR" } } }),
    ).toBe(0);
  });

  it("guarda no máximo 50 dicas por aluno", async () => {
    lumiService.gerarDica.mockResolvedValue({ dica: "ok" });

    for (let i = 0; i < 52; i++) {
      await pedirDica(tokenOutroAluno, `Pergunta ${i}`);
    }

    const total = await prisma.lumiDica.count({
      where: { aluno: { tipo: "ALUNO", dicasLumi: { some: {} } } },
    });
    expect(total).toBeLessThanOrEqual(100);

    const hist = await request(app)
      .get("/api/v1/lumi/historico?limite=50")
      .set(auth(tokenOutroAluno));
    expect(hist.body.dicas.length).toBeLessThanOrEqual(50);
  });
});
