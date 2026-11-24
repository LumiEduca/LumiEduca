import { ApiError } from "../middlewares/errorHandler.js";
import { lumiRepository } from "../repositories/lumiRepository.js";
import { explicarErro } from "./lumiService.js";

const MENSAGEM_ACERTO =
  "Parabéns, você acertou essa! 🦊⭐ Continue assim, que você está indo muito bem!";

const normalizar = (valor) => String(valor).trim().toLocaleLowerCase("pt-BR");

// Mesma equivalência do progressoService: true/verdadeiro e false/falso.
function textoVerdadeiroFalso(valor) {
  const n = normalizar(valor);
  if (["true", "verdadeiro"].includes(n)) return "Verdadeiro";
  if (["false", "falso"].includes(n)) return "Falso";
  return String(valor).trim();
}

// Múltipla escolha: a resposta é o índice da opção (como texto). Se não achar, usa o próprio valor.
function textoDaOpcao(opcoes, indice) {
  const texto = opcoes[Number(indice)];
  return texto !== undefined ? texto : String(indice);
}

// A resposta do corpo precisa ser a que o aluno gravou, respeitando a regra de cada tipo.
function mesmaResposta(tipo, enviada, gravada) {
  if (tipo === "VERDADEIRO_FALSO") {
    return textoVerdadeiroFalso(enviada) === textoVerdadeiroFalso(gravada);
  }
  if (tipo === "LACUNA") {
    return normalizar(enviada) === normalizar(gravada);
  }
  return String(enviada).trim() === String(gravada).trim();
}

/**
 * Regras (conferidas no BANCO, nunca só no corpo da requisição):
 * - questão inexistente: 404
 * - aluno ainda não respondeu essa questão: 403 (a resposta correta não é revelada)
 * - resposta do corpo diferente da gravada: 400
 * - aluno acertou: mensagem de parabéns, sem chamar o Gemini
 * - aluno errou: o Gemini explica
 *
 * Tipos (PR #71): MULTIPLA_ESCOLHA compara por índice; VERDADEIRO_FALSO e LACUNA
 * comparam texto e não dependem de opcoes (a lacuna tem opcoes vazio).
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

  const tipo = questao.tipo ?? "MULTIPLA_ESCOLHA";

  if (!mesmaResposta(tipo, resposta, registro.resposta)) {
    throw new ApiError(
      400,
      "A resposta informada não é a que você deu nesta questão",
    );
  }

  // "correta" foi calculada e gravada pelo progressoService no momento da resposta.
  if (registro.correta) {
    return { acertou: true, explicacao: MENSAGEM_ACERTO };
  }

  let dados;

  if (tipo === "VERDADEIRO_FALSO") {
    dados = {
      opcoes: [],
      respostaAluno: textoVerdadeiroFalso(registro.resposta),
      respostaCorreta: textoVerdadeiroFalso(questao.respostaCorreta),
    };
  } else if (tipo === "LACUNA") {
    dados = {
      opcoes: [],
      respostaAluno: String(registro.resposta).trim(),
      respostaCorreta: String(questao.respostaCorreta).trim(),
    };
  } else {
    const opcoes = Array.isArray(questao.opcoes)
      ? questao.opcoes.map(String)
      : [];
    dados = {
      opcoes,
      respostaAluno: textoDaOpcao(opcoes, registro.resposta),
      respostaCorreta: textoDaOpcao(opcoes, questao.respostaCorreta),
    };
  }

  const { explicacao } = await explicarErro({
    enunciado: questao.enunciado,
    tipo,
    ...dados,
  });

  return { acertou: false, explicacao };
}
