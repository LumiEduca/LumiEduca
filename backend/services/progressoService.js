import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

const PONTOS_POR_ACERTO = 10;

function calcularEstrelas(acertos, total, concluida) {
  if (!concluida || total === 0) return 0;
  const taxa = acertos / total;
  if (taxa >= 0.9) return 3;
  if (taxa >= 0.6) return 2;
  return 1;
}

// Monta as fases (uma por atividade com questões) das salas do aluno
async function montarFases(alunoId) {
  const matriculas = await prisma.matricula.findMany({
    where: { alunoId },
    select: { salaId: true },
  });
  const salaIds = matriculas.map((m) => m.salaId);

  const atividades = await prisma.atividade.findMany({
    where: { salaAtividades: { some: { salaId: { in: salaIds } } } },
    orderBy: { criadaEm: "asc" },
    select: {
      id: true,
      titulo: true,
      materia: true,
      questoes: { select: { id: true } },
    },
  });

  const respostas = await prisma.resposta.findMany({
    where: { alunoId },
    select: { correta: true, questao: { select: { atividadeId: true } } },
  });

  return atividades
    .filter((a) => a.questoes.length > 0)
    .map((a, i) => {
      const doAluno = respostas.filter((r) => r.questao.atividadeId === a.id);
      const acertos = doAluno.filter((r) => r.correta).length;
      const total = a.questoes.length;
      const concluida = doAluno.length >= total;
      return {
        ordem: i + 1,
        atividadeId: a.id,
        titulo: a.titulo,
        materia: a.materia,
        questoesTotal: total,
        questoesRespondidas: doAluno.length,
        concluida,
        pontos: acertos * PONTOS_POR_ACERTO,
        estrelas: calcularEstrelas(acertos, total, concluida),
      };
    });
}

function somarTotais(fases) {
  return {
    totalPontos: fases.reduce((s, f) => s + f.pontos, 0),
    totalEstrelas: fases.reduce((s, f) => s + f.estrelas, 0),
  };
}

export async function responderQuestao(alunoId, { questaoId, resposta }) {
  const questao = await prisma.questao.findUnique({
    where: { id: questaoId },
    include: { atividade: { select: { id: true, materia: true } } },
  });
  if (!questao) throw new ApiError(404, "Questão não encontrada");

  const atividadeId = questao.atividade.id;

  // Aluno precisa estar em alguma sala que tenha esta atividade
  const matricula = await prisma.matricula.findFirst({
    where: { alunoId, sala: { salaAtividades: { some: { atividadeId } } } },
  });
  if (!matricula) {
    throw new ApiError(403, "Esta atividade não está disponível para você");
  }

  const jaRespondeu = await prisma.resposta.findUnique({
    where: { alunoId_questaoId: { alunoId, questaoId } },
  });
  if (jaRespondeu) throw new ApiError(409, "Você já respondeu esta questão");

  const correta = String(resposta).trim() === questao.respostaCorreta.trim();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.resposta.create({
        data: { alunoId, questaoId, resposta: String(resposta), correta },
      });

      const total = await tx.questao.count({ where: { atividadeId } });
      const respondidas = await tx.resposta.count({
        where: { alunoId, questao: { atividadeId } },
      });
      const acertos = await tx.resposta.count({
        where: { alunoId, correta: true, questao: { atividadeId } },
      });

      const concluida = respondidas >= total;
      const pontos = acertos * PONTOS_POR_ACERTO;

      await tx.progresso.upsert({
        where: { alunoId_atividadeId: { alunoId, atividadeId } },
        update: { pontos, concluida },
        create: {
          alunoId,
          atividadeId,
          materia: questao.atividade.materia,
          pontos,
          concluida,
        },
      });

      return {
        correta,
        respostaCorreta: questao.respostaCorreta,
        pontosGanhos: correta ? PONTOS_POR_ACERTO : 0,
        atividade: {
          id: atividadeId,
          questoesTotal: total,
          questoesRespondidas: respondidas,
          concluida,
          pontos,
          estrelas: calcularEstrelas(acertos, total, concluida),
        },
      };
    });
  } catch (error) {
    // Duas requisições simultâneas para a mesma questão
    if (error.code === "P2002") {
      throw new ApiError(409, "Você já respondeu esta questão");
    }
    throw error;
  }
}

export async function progressoGeral(solicitante, alunoId) {
  const aluno = await prisma.usuario.findUnique({
    where: { id: alunoId },
    select: { id: true, nome: true, usuario: true, tipo: true },
  });
  if (!aluno || aluno.tipo !== "ALUNO") {
    throw new ApiError(404, "Aluno não encontrado");
  }

  if (solicitante.tipo === "ALUNO") {
    if (solicitante.id !== alunoId) {
      throw new ApiError(403, "Você só pode ver o seu próprio progresso");
    }
  } else {
    const vinculo = await prisma.matricula.findFirst({
      where: { alunoId, sala: { professorId: solicitante.id } },
    });
    if (!vinculo) throw new ApiError(403, "Este aluno não pertence às suas salas");
  }

  const fases = await montarFases(alunoId);
  return {
    aluno: { id: aluno.id, nome: aluno.nome, usuario: aluno.usuario },
    ...somarTotais(fases),
    fasesConcluidas: fases.filter((f) => f.concluida).length,
    totalFases: fases.length,
    fases,
  };
}

export async function trilhaDoAluno(alunoId) {
  const fases = await montarFases(alunoId);

  let atualMarcada = false;
  const trilha = fases.map((f) => {
    if (f.concluida) return { ...f, estado: "CONCLUIDA" };
    if (!atualMarcada) {
      atualMarcada = true;
      return { ...f, estado: "ATUAL" };
    }
    return { ...f, estado: "BLOQUEADA" };
  });

  return {
    faseAtualId: trilha.find((f) => f.estado === "ATUAL")?.atividadeId ?? null,
    ...somarTotais(fases),
    fases: trilha,
  };
}