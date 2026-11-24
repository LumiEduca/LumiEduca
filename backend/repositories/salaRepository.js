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

  // ---------- NOVOS ----------

  async atualizarNome(id, nome) {
    return prisma.sala.update({ where: { id }, data: { nome } });
  },

  // deleteMany devolve { count }, assim não estoura erro se a matrícula não existir
  async removerMatricula(salaId, alunoId) {
    return prisma.matricula.deleteMany({ where: { salaId, alunoId } });
  },

  // Soma os pontos de cada aluno nas atividades associadas a esta sala
  async rankingPorSala(salaId) {
    const [matriculas, vinculos] = await Promise.all([
      prisma.matricula.findMany({
        where: { salaId },
        include: { aluno: { select: { id: true, nome: true } } },
      }),
      prisma.salaAtividade.findMany({
        where: { salaId },
        select: { atividadeId: true },
      }),
    ]);

    const somas = await prisma.progresso.groupBy({
      by: ["alunoId"],
      where: {
        alunoId: { in: matriculas.map((m) => m.alunoId) },
        atividadeId: { in: vinculos.map((v) => v.atividadeId) },
      },
      _sum: { pontos: true },
    });

    const pontosPorAluno = new Map(
      somas.map((s) => [s.alunoId, s._sum.pontos ?? 0]),
    );

    return matriculas
      .map((m) => ({
        alunoId: m.aluno.id,
        nome: m.aluno.nome,
        pontos: pontosPorAluno.get(m.alunoId) ?? 0,
      }))
      .sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome))
      .map((item, i) => ({ posicao: i + 1, ...item }));
  },
};