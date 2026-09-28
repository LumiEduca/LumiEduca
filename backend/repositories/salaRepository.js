import prisma from "../config/prismaClient.js";

export const salaRepository = {
  async criar({ nome, codigo, professorId }) {
    return prisma.sala.create({
      data: { nome, codigo, professorId },
    });
  },

  async buscarPorId(id) {
    return prisma.sala.findUnique({
      where: { id },
      include: {
        professor: { select: { id: true, nome: true } },
        matriculas: {
          include: { aluno: { select: { id: true, nome: true } } },
        },
      },
    });
  },

  async buscarPorCodigo(codigo) {
    return prisma.sala.findUnique({ where: { codigo } });
  },

  async listarPorProfessor(professorId) {
    return prisma.sala.findMany({
      where: { professorId },
      orderBy: { criadaEm: "desc" },
      include: { matriculas: true },
    });
  },

  // upsert evita erro se o aluno tentar entrar duas vezes na mesma sala
  async matricularAluno(salaId, alunoId) {
    return prisma.matricula.upsert({
      where: { alunoId_salaId: { alunoId, salaId } },
      update: {},
      create: { alunoId, salaId },
    });
  },

  async remover(id) {
    return prisma.sala.delete({ where: { id } });
  },
};