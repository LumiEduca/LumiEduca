import { ApiError } from "../middlewares/errorHandler.js";
import { lumiRepository } from "../repositories/lumiRepository.js";
import { explicarErro } from "./lumiService.js";

const MENSAGEM_ACERTO =
  "Parabéns, você acertou essa! 🦊⭐ Continue assim, que você está indo muito bem!";

// A resposta é o índice da opção (como texto). Se não achar, usa o próprio valor.
function textoDaOpcao(opcoes, indice) {
  const texto = opcoes[Number(indice)];
  return texto !== undefined ? texto : String(indice);
}

/**
 * Regras (conferidas no BANCO, nunca só no corpo da requisição):
 * - questão inexistente: 404
 * - aluno ainda não respondeu essa questão: 403 (a resposta correta não é revelada)
 * - resposta do corpo diferente da gravada: 400
 * - aluno acertou: mensagem de parabéns, sem chamar o Gemini
 * - aluno errou: o Gemini explica
 */
export async function explicarErroDoAluno(alunoId, { questaoId, resposta }) {
  const questao = await lumiRepository.buscarQuestao(questaoId);
  if (!questao) throw new ApiError(404, "Questão não encontrada");

  const registro = await lumiRepository.buscarRespostaDoAluno(
    alunoId,
    questaoId,
  );
  if (!registro) {
    throw new ApiError(
      403,
      "Responda a questão antes de pedir a explicação do Lumi",
    );
  }

  if (String(resposta).trim() !== registro.resposta.trim()) {
    throw new ApiError(
      400,
      "A resposta informada não é a que você deu nesta questão",
    );
  }

  if (registro.correta) {
    return { acertou: true, explicacao: MENSAGEM_ACERTO };
  }

  const opcoes = Array.isArray(questao.opcoes)
    ? questao.opcoes.map(String)
    : [];

  const { explicacao } = await explicarErro({
    enunciado: questao.enunciado,
    opcoes,
    respostaAluno: textoDaOpcao(opcoes, registro.resposta),
    respostaCorreta: textoDaOpcao(opcoes, questao.respostaCorreta),
  });

  return { acertou: false, explicacao };
}
