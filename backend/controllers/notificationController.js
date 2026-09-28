import { sendNotification } from "../services/notificationService.js";
import prisma from "../config/prismaClient.js";

// POST /token - Registar o token do dispositivo
export const saveToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const usuarioId = req.usuario.id;

    if (!token) {
      return res.status(400).json({ erro: "O token é obrigatório" });
    }

    await prisma.notificacaoToken.upsert({
      where: { token: token },
      update: { usuarioId: usuarioId },
      create: { token: token, usuarioId: usuarioId }
    });

    res.status(200).json({ sucesso: true, mensagem: "Token registado com sucesso" });
  } catch (error) {
    next(error);
  }
};

// POST /disparar - Disparar notificação (Apenas professores)
export const sendToAll = async (req, res, next) => {
  try {
    if (req.usuario.tipo !== 'PROFESSOR') {
      return res.status(403).json({ erro: "Acesso negado. Apenas professores podem disparar notificações." });
    }

    const { title, body } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ erro: "O título da notificação é obrigatório e não pode ser vazio." });
    }
    if (!body || typeof body !== 'string' || body.trim() === '') {
      return res.status(400).json({ erro: "O corpo da notificação é obrigatório e não pode ser vazio." });
    }

    const tokens = await prisma.notificacaoToken.findMany();

    let enviadas = 0;
    let falhas = 0;

    // TODO: no futuro deve filtrar pelas salas do professor

    for (const t of tokens) {
      try {
        await sendNotification(t.token, { title, body });
        enviadas++;
      } catch (error) {
        falhas++;
        const firebaseErrorCode = error.code || error.message;
        
        if (
          firebaseErrorCode === 'messaging/registration-token-not-registered' ||
          firebaseErrorCode === 'messaging/invalid-registration-token'
        ) {
          await prisma.notificacaoToken.delete({
            where: { token: t.token }
          });
        }
      }
    }

    res.status(200).json({ sucesso: true, enviadas, falhas });
  } catch (error) {
    next(error);
  }
};

// GET /historico - Lista notificações enviadas ao utilizador logado
export const getHistorico = async (req, res, next) => {
  try {
    res.status(200).json({
      sucesso: true,
      mensagem: "Rota de histórico criada. Requer modelo de Notificações no schema para listar os dados.",
      dados: []
    });
  } catch (error) {
    next(error);
  }
};