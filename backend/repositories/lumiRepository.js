import prisma from "../config/prismaClient.js";

// Teto de dicas guardadas por aluno: evita a tabela crescer sem fim.
export const MAX_DICAS_POR_ALUNO = 50;

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
        tipo: true,
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

  // Grava uma dica bem-sucedida e apaga as mais antigas além do teto, em uma transação.
  async salvarDica({ alunoId, questaoId, pergunta, resposta }) {
    return prisma.$transaction(async (tx) => {
      const criada = await tx.lumiDica.create({
        data: { alunoId, questaoId: questaoId ?? null, pergunta, resposta },
        select: { id: true },
      });

      const excedentes = await tx.lumiDica.findMany({
        where: { alunoId },
        orderBy: { criadaEm: "desc" },
        skip: MAX_DICAS_POR_ALUNO,
        select: { id: true },
      });

      if (excedentes.length > 0) {
        await tx.lumiDica.deleteMany({
          where: { id: { in: excedentes.map((d) => d.id) } },
        });
      }

      return criada;
    });
  },

  // Só as dicas do próprio aluno, da mais recente para a mais antiga.
  async listarDicasDoAluno(alunoId, limite) {
    return prisma.lumiDica.findMany({
      where: { alunoId },
      orderBy: { criadaEm: "desc" },
      take: limite,
      select: {
        id: true,
        questaoId: true,
        pergunta: true,
        resposta: true,
        criadaEm: true,
      },
    });
  },
};
