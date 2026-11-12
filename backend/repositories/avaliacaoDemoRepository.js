import prisma from "../config/prismaClient.js";

export const criar = ({ jogo, nota }) =>
  prisma.avaliacaoDemo.create({
    data: { jogo, nota },
    select: { id: true, jogo: true, nota: true, criadaEm: true },
  });

export const contagemPorJogoENota = () =>
  prisma.avaliacaoDemo.groupBy({
    by: ["jogo", "nota"],
    _count: { _all: true },
  });