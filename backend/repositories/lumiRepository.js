import prisma from "../config/prismaClient.js";

export const lumiRepository = {
  // Dados da questão. A respostaCorreta NUNCA sai daqui direto para o aluno:
  // quem decide se ela pode ser usada é o lumiExplicacaoService.
  async buscarQuestao(questaoId) {
    return prisma.questao.findUnique({
      where: { id: questaoId },
      select: {
        id: true,
        enunciado: true,
        opcoes: true,
        respostaCorreta: true,
      },
    });
  },

  // A resposta que o aluno realmente gravou (existe no máximo uma por aluno e questão)
  async buscarRespostaDoAluno(alunoId, questaoId) {
    return prisma.resposta.findUnique({
      where: { alunoId_questaoId: { alunoId, questaoId } },
      select: { resposta: true, correta: true },
    });
  },
};
