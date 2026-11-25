import { jest } from "@jest/globals";

const transacao = {
  resposta: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  questao: { count: jest.fn() },
  progresso: {
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  conquista: { upsert: jest.fn() },
  usuarioConquista: { createMany: jest.fn() },
};

const prisma = {
  atividade: { create: jest.fn() },
  questao: { findUnique: jest.fn() },
  matricula: { findFirst: jest.fn() },
  resposta: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

jest.unstable_mockModule("../config/prismaClient.js", () => ({
  default: prisma,
}));

const { criarAtividade } = await import("../controllers/atividadeController.js");
const { responderQuestao } = await import("../services/progressoService.js");
const { criarAtividadeSchema } = await import("../schemas/atividadeSchemas.js");

const criarRespostaHttp = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeEach(() => {
  jest.resetAllMocks();
  prisma.atividade.create.mockImplementation(async ({ data }) => ({
    id: "atividade-teste",
    questoes: data.questoes.create,
  }));
  prisma.$transaction.mockImplementation((callback) => callback(transacao));
  prisma.questao.findUnique.mockResolvedValue({
    id: "questao-teste",
    opcoes: ["Errado", "Correto"],
    respostaCorreta: "1",
    atividade: { id: "atividade-teste", materia: "Português" },
  });
  prisma.matricula.findFirst.mockResolvedValue({ id: "matricula-teste" });
  prisma.resposta.findUnique.mockResolvedValue(null);
  transacao.resposta.count
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1);
  transacao.questao.count.mockResolvedValue(1);
  transacao.resposta.findMany.mockResolvedValue([]);
  transacao.progresso.upsert.mockResolvedValue({});
  transacao.progresso.count.mockResolvedValue(0);
  transacao.progresso.aggregate.mockResolvedValue({ _sum: { pontos: 10 } });
});

describe("validação de atividades e correção sem banco de dados", () => {
  it.each([
    [true, "Verdadeiro"],
    [false, "Falso"],
    ["true", "Verdadeiro"],
    ["false", "Falso"],
    ["verdadeiro", "Verdadeiro"],
    ["falso", "Falso"],
  ])("normaliza resposta V/F %s", async (respostaCorreta, esperada) => {
    const res = criarRespostaHttp();

    await criarAtividade(
      {
        body: {
          titulo: "Atividade V/F",
          materia: "Português",
          questoes: [
            {
              tipo: "VERDADEIRO_FALSO",
              enunciado: "A afirmação é correta?",
              respostaCorreta,
            },
          ],
        },
        usuario: { id: "professor-teste" },
      },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].questoes[0].respostaCorreta).toBe(esperada);
  });

  it.each([
    ["tipo", "DISSERTATIVA"],
    ["respostaCorreta", "talvez"],
    ["respostaCorreta", 1],
    ["respostaCorreta", ["true"]],
  ])("rejeita %s inválido com HTTP 400", async (campo, valor) => {
    const res = criarRespostaHttp();
    const next = jest.fn();
    const questao = {
      tipo: "VERDADEIRO_FALSO",
      enunciado: "A afirmação é correta?",
      respostaCorreta: "true",
    };
    questao[campo] = valor;

    await criarAtividade(
      {
        body: {
          titulo: "Atividade inválida",
          materia: "Português",
          questoes: [questao],
        },
        usuario: { id: "professor-teste" },
      },
      res,
      next
    );

    expect(next.mock.calls[0][0].status).toBe(400);
    expect(prisma.atividade.create).not.toHaveBeenCalled();
  });

  it.each([1, ["true"]])(
    "schema rejeita resposta V/F que não seja boolean ou texto permitido (%s)",
    (respostaCorreta) => {
      const resultado = criarAtividadeSchema.safeParse({
        titulo: "Atividade V/F",
        materia: "Português",
        questoes: [
          {
            tipo: "VERDADEIRO_FALSO",
            enunciado: "A afirmação é correta?",
            respostaCorreta,
          },
        ],
      });

      expect(resultado.success).toBe(false);
    }
  );

  it("corrige questão antiga sem tipo e mantém a correção de múltipla escolha", async () => {
    const resultado = await responderQuestao("aluno-teste", {
      questaoId: "questao-teste",
      resposta: "1",
    });

    expect(resultado.correta).toBe(true);
    expect(transacao.resposta.create.mock.calls[0][0].data.correta).toBe(true);
  });

  it("corrige lacuna ignorando caixa e espaços nas pontas", async () => {
    prisma.questao.findUnique.mockResolvedValue({
      id: "questao-teste",
      tipo: "LACUNA",
      opcoes: [],
      respostaCorreta: "Brasília",
      atividade: { id: "atividade-teste", materia: "Geografia" },
    });

    const resultado = await responderQuestao("aluno-teste", {
      questaoId: "questao-teste",
      resposta: "  brasília  ",
    });

    expect(resultado.correta).toBe(true);
    expect(transacao.resposta.create.mock.calls[0][0].data.resposta).toBe(
      "  brasília  "
    );
  });
});
