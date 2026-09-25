import prisma from "../config/prismaClient.js";
import { sendNotification } from "../services/notificationService.js";
import { ApiError } from "../middlewares/errorHandler.js";

export const saveToken = async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw new ApiError(400, "userId e token são obrigatórios");
    }

    await prisma.notificacaoToken.upsert({
      where: { token },
      update: {
        usuarioId: userId,
      },
      create: {
        usuarioId: userId,
        token,
      },
    });

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

export const sendToAll = async (req, res, next) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      throw new ApiError(400, "title e body são obrigatórios");
    }

    const tokens = await prisma.notificacaoToken.findMany();

    for (const item of tokens) {
      await sendNotification(item.token, { title, body });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};