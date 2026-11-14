import admin from "./firebaseAdmin.js";
import prisma from "../config/prismaClient.js";

export const sendNotification = async (token, data) => {
  await admin.messaging().send({
    token,
    notification: {
      title: data.title,
      body: data.body,
    },
  });
};

// Cria no histórico de cada aluno matriculado o aviso de nova atividade na sala.
// Retorna quantos avisos foram criados.
export const notificarNovaAtividade = async ({ salaId, salaNome, atividadeTitulo }) => {
  const matriculas = await prisma.matricula.findMany({
    where: { salaId },
    select: { alunoId: true },
  });
  if (matriculas.length === 0) return 0;

  const resultado = await prisma.notificacao.createMany({
    data: matriculas.map((m) => ({
      usuarioId: m.alunoId,
      titulo: "Nova atividade",
      corpo: `O professor adicionou "${atividadeTitulo}" à sala ${salaNome}.`,
    })),
  });
  return resultado.count;
};