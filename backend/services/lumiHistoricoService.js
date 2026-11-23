import { lumiRepository } from "../repositories/lumiRepository.js";

/**
 * Grava a dica no histórico do aluno. NUNCA lança erro: se o banco falhar
 * (por exemplo, tabela ainda não migrada), a dica já foi gerada e continua sendo devolvida.
 */
export async function registrarDica({
  alunoId,
  questaoId,
  pergunta,
  resposta,
}) {
  try {
    await lumiRepository.salvarDica({ alunoId, questaoId, pergunta, resposta });
  } catch (error) {
    console.error("[lumi] Falha ao gravar histórico de dicas:", error.message);
  }
}

export async function listarHistorico(alunoId, limite) {
  const dicas = await lumiRepository.listarDicasDoAluno(alunoId, limite);
  return { dicas };
}
