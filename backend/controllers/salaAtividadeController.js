import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

export const associarAtividade = async (req, res, next) => {
  try {
    if (req.usuario.tipo !== "PROFESSOR") {
      throw new ApiError(403, "Apenas professor pode associar atividades a uma sala.");
    }

    const { idAtividade } = req.body ?? {};
    if (typeof idAtividade !== "string" || !idAtividade.trim()) {
      throw new ApiError(400, "Informe o campo 'idAtividade'.");
    }

    const sala = await prisma.sala.findUnique({
      where: { id: req.params.id },
      select: { id: true, professorId: true },
    });
    if (!sala) throw new ApiError(404, "Sala não encontrada.");
    if (sala.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode alterar esta sala.");
    }

    const atividade = await prisma.atividade.findUnique({
      where: { id: idAtividade.trim() },
      select: { id: true, professorId: true },
    });
    if (!atividade) throw new ApiError(404, "Atividade não encontrada.");
    if (atividade.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode associar esta atividade.");
    }

    try {
      const associacao = await prisma.salaAtividade.create({
        data: { salaId: sala.id, atividadeId: atividade.id },
      });
      return res.status(201).json(associacao);
    } catch (error) {
      if (error.code === "P2002") {
        throw new ApiError(409, "Esta atividade já está associada à sala.");
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const listarAtividadesDaSala = async (req, res, next) => {
  try {
    const sala = await prisma.sala.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        professorId: true,
        matriculas: {
          where: { alunoId: req.usuario.id },
          select: { id: true },
        },
      },
    });
    if (!sala) throw new ApiError(404, "Sala não encontrada.");

    const ehProfessorDono =
      req.usuario.tipo === "PROFESSOR" && sala.professorId === req.usuario.id;
    const ehAlunoMatriculado =
      req.usuario.tipo === "ALUNO" && sala.matriculas.length > 0;
    if (!ehProfessorDono && !ehAlunoMatriculado) {
      throw new ApiError(403, "Você não tem acesso a esta sala.");
    }

    const associacoes = await prisma.salaAtividade.findMany({
      where: { salaId: sala.id },
      orderBy: { criadaEm: "desc" },
      include: {
        atividade: {
          include: { questoes: { orderBy: { ordem: "asc" } } },
        },
      },
    });

    const atividades = associacoes.map(({ atividade }) => {
      if (!ehAlunoMatriculado) return atividade;

      return {
        ...atividade,
        questoes: atividade.questoes.map(({ respostaCorreta, ...questao }) => questao),
      };
    });

    res.json(atividades);
  } catch (error) {
    next(error);
  }
};