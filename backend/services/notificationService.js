import admin from "./firebaseAdmin.js";
import prisma from "../config/prismaClient.js";

const MAX_TOKENS = 500;
const LOTE = 25;
const TOKENS_INVALIDOS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

export const sendNotification = async (token, data) => {
  await admin.messaging().send({
    token,
    notification: {
      title: data.title,
      body: data.body,
    },
  });
};

// Envia push para todos os dispositivos dos usuários informados.
// Nunca lança erro: falhas só entram na contagem. Remove tokens inválidos.
export const enviarPush = async (usuarioIds, { title, body }) => {
  const ids = [...new Set(usuarioIds)];
  if (ids.length === 0) return { enviadas: 0, falhas: 0 };

  const tokens = await prisma.notificacaoToken.findMany({
    where: { usuarioId: { in: ids } },
    take: MAX_TOKENS,
  });

  let enviadas = 0;
  let falhas = 0;

  for (let i = 0; i < tokens.length; i += LOTE) {
    const lote = tokens.slice(i, i + LOTE);
    const resultados = await Promise.allSettled(
      lote.map((t) => sendNotification(t.token, { title, body }))
    );

    for (let j = 0; j < resultados.length; j++) {
      const r = resultados[j];
      if (r.status === "fulfilled") {
        enviadas++;
        continue;
      }
      falhas++;
      const codigo = r.reason?.code || r.reason?.message;
      if (TOKENS_INVALIDOS.includes(codigo)) {
        try {
          await prisma.notificacaoToken.deleteMany({ where: { token: lote[j].token } });
        } catch (error) {
          console.error("Falha ao remover token inválido:", error);
        }
      }
    }
  }

  return { enviadas, falhas };
};

// Cria no histórico de cada aluno matriculado o aviso de nova atividade na sala
// e tenta enviar o push. Retorna quantos avisos foram criados.
export const notificarNovaAtividade = async ({ salaId, salaNome, atividadeTitulo }) => {
  const matriculas = await prisma.matricula.findMany({
    where: { salaId },
    select: { alunoId: true },
  });
  if (matriculas.length === 0) return 0;

  const titulo = "Nova atividade";
  const corpo = `O professor adicionou "${atividadeTitulo}" à sala ${salaNome}.`;

  const resultado = await prisma.notificacao.createMany({
    data: matriculas.map((m) => ({ usuarioId: m.alunoId, titulo, corpo })),
  });

  try {
    await enviarPush(
      matriculas.map((m) => m.alunoId),
      { title: titulo, body: corpo }
    );
  } catch (error) {
    console.error("Falha ao enviar push de nova atividade:", error);
  }

  return resultado.count;
};