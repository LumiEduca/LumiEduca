import { jest } from "@jest/globals";

const lumiRepository = {
  buscarQuestao: jest.fn(),
  buscarRespostaDoAluno: jest.fn(),
};
const explicarErro = jest.fn();

jest.unstable_mockModule("../repositories/lumiRepository.js", () => ({
  lumiRepository,
}));
jest.unstable_mockModule("../services/lumiService.js", () => ({
  explicarErro,
}));

const { explicarErroDoAluno } =
  await import("../services/lumiExplicacaoService.js");

const questaoMC = {
  id: "q1",
  tipo: "MULTIPLA_ESCOLHA",
  enunciado: "Quanto é 1+1?",
  opcoes: ["1", "2", "3"],
  respostaCorreta: "1",
};
const questaoVF = {
  id: "q2",
  tipo: "VERDADEIRO_FALSO",
  enunciado: "O sol é uma estrela.",
  opcoes: [],
  respostaCorreta: "verdadeiro",
};
const questaoLacuna = {
  id: "q3",
  tipo: "LACUNA",
  enunciado: "O gato faz ____.",
  opcoes: [],
  respostaCorreta: "miau",
};

describe("explicarErroDoAluno (repository e Gemini mockados)", () => {
  beforeEach(() => {
    lumiRepository.buscarQuestao.mockReset();
    lumiRepository.buscarRespostaDoAluno.mockReset();
    explicarErro.mockReset().mockResolvedValue({ explicacao: "Quase! 🦊" });
  });

  it("404 quando a questão não existe", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(null);
    await expect(
      explicarErroDoAluno("a1", { questaoId: "x", resposta: 0 }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("403 quando o aluno ainda não respondeu (e não chama o Gemini)", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoMC);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue(null);

    await expect(
      explicarErroDoAluno("a1", { questaoId: "q1", resposta: 0 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(explicarErro).not.toHaveBeenCalled();
  });

  it("400 quando a resposta do corpo difere da gravada", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoMC);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "2",
      correta: false,
    });

    await expect(
      explicarErroDoAluno("a1", { questaoId: "q1", resposta: 0 }),
    ).rejects.toMatchObject({ status: 400 });
    expect(explicarErro).not.toHaveBeenCalled();
  });

  it("acerto devolve parabéns sem chamar o Gemini", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoVF);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "true",
      correta: true,
    });

    const res = await explicarErroDoAluno("a1", {
      questaoId: "q2",
      resposta: "true",
    });

    expect(res.acertou).toBe(true);
    expect(explicarErro).not.toHaveBeenCalled();
  });

  it("múltipla escolha: envia o texto das opções (índice vira texto)", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoMC);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "2",
      correta: false,
    });

    const res = await explicarErroDoAluno("a1", {
      questaoId: "q1",
      resposta: 2,
    });

    expect(res).toEqual({ acertou: false, explicacao: "Quase! 🦊" });
    expect(explicarErro).toHaveBeenCalledWith({
      enunciado: "Quanto é 1+1?",
      tipo: "MULTIPLA_ESCOLHA",
      opcoes: ["1", "2", "3"],
      respostaAluno: "3",
      respostaCorreta: "2",
    });
  });

  it("verdadeiro/falso: compara como texto, normaliza e não usa opções", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoVF);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "false",
      correta: false,
    });

    await explicarErroDoAluno("a1", { questaoId: "q2", resposta: "Falso" });

    expect(explicarErro).toHaveBeenCalledWith({
      enunciado: "O sol é uma estrela.",
      tipo: "VERDADEIRO_FALSO",
      opcoes: [],
      respostaAluno: "Falso",
      respostaCorreta: "Verdadeiro",
    });
  });

  it("lacuna: opcoes vazio não quebra e a comparação ignora maiúsculas", async () => {
    lumiRepository.buscarQuestao.mockResolvedValue(questaoLacuna);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "Au au",
      correta: false,
    });

    await explicarErroDoAluno("a1", { questaoId: "q3", resposta: "au AU" });

    expect(explicarErro).toHaveBeenCalledWith({
      enunciado: "O gato faz ____.",
      tipo: "LACUNA",
      opcoes: [],
      respostaAluno: "Au au",
      respostaCorreta: "miau",
    });
  });

  it("questão sem tipo (antiga) é tratada como múltipla escolha", async () => {
    const { tipo, ...semTipo } = questaoMC;
    lumiRepository.buscarQuestao.mockResolvedValue(semTipo);
    lumiRepository.buscarRespostaDoAluno.mockResolvedValue({
      resposta: "2",
      correta: false,
    });

    await explicarErroDoAluno("a1", { questaoId: "q1", resposta: 2 });

    expect(explicarErro.mock.calls[0][0].tipo).toBe("MULTIPLA_ESCOLHA");
  });
});
