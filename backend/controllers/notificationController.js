import { sendNotification } from "../services/notificationService.js";

let tokens = [];

export const saveToken = (req, res) => {
  const { userId, token } = req.body;

  const jaExiste = tokens.find((t) => t.userId === userId);

  if (!jaExiste) {
    tokens.push({ userId, token });
  }

  res.sendStatus(200);
};

export const sendToAll = async (req, res) => {
  const { title, body } = req.body;

  try {
    for (const user of tokens) {
      await sendNotification(user.token, { title, body });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao enviar notificação" });
  }
};