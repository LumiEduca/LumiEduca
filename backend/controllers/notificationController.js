import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { sendNotification } from "../services/notificationService.js";

const MAX_TOKENS = 500;
const LOTE = 25;
const TOKENS_INVALIDOS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

// POST /token - Registrar o token do dispositivo
export const saveToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const usuarioId = req.usuario.id;

    await prisma.notificacaoToken.upsert({
      where: { token },
      update: { usuarioId },
      create: { token, usuarioId },
    });

    res.status(200).json({ sucesso: true, mensagem: "Token registado com sucesso" });
  } catch (error) {
    next(error);
  }
};

// POST /disparar - Professor notifica os alunos das SUAS salas (ou de uma sala específica)
export const sendToAll = async (req, res, next) => {
  try {
    const { title, body, salaId } = req.body;

    const salas = await prisma.sala.findMany({
      where: { professorId: req.usuario.id, ...(salaId ? { id: salaId } : {}) },
      select: { id: true },
    });
    if (salaId && salas.length === 0) {
      throw new ApiError(403, "Você só pode notificar alunos das suas salas");
    }

    const matriculas = await prisma.matricula.findMany({
      where: { salaId: { in: salas.map((s) => s.id) } },
      select: { alunoId: true },
      distinct: ["alunoId"],
    });
    const alunoIds = matriculas.map((m) => m.alunoId);

    if (alunoIds.length === 0) {
      return res.status(200).json({ sucesso: true, destinatarios: 0, enviadas: 0, falhas: 0 });
    }

    // Guarda no histórico de cada aluno
    await prisma.notificacao.createMany({
      data: alunoIds.map((usuarioId) => ({ usuarioId, titulo: title, corpo: body })),
    });

    const tokens = await prisma.notificacaoToken.findMany({
      where: { usuarioId: { in: alunoIds } },
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
          await prisma.notificacaoToken.deleteMany({ where: { token: lote[j].token } });
        }
      }
    }

    res.status(200).json({ sucesso: true, destinatarios: alunoIds.length, enviadas, falhas });
  } catch (error) {
    next(error);
  }
};

// GET /historico - Notificações do usuário logado
export const getHistorico = async (req, res, next) => {
  try {
    const dados = await prisma.notificacao.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { criadaEm: "desc" },
      take: 50,
    });
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    next(error);
  }
};