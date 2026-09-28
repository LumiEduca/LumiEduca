import { sendNotification } from "../services/notificationService.js";
import prisma from "../config/prismaClient.js";

// POST /token - Registar o token do dispositivo
export const saveToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const usuarioId = req.usuario.id; // O ID vem do token JWT descodificado no middleware auth

    if (!token) {
      return res.status(400).json({ erro: "O token é obrigatório" }); // Utiliza o padrão de resposta de erro da API
    }

    // Persistência com Prisma (evita duplicações com upsert)
    await prisma.notificacaoToken.upsert({
      where: { token: token }, // Assume que "token" é @unique no schema.prisma
      update: { usuarioId: usuarioId },
      create: {
        token: token,
        usuarioId: usuarioId
      }
    });

    res.status(200).json({ sucesso: true, mensagem: "Token registado com sucesso" });
  } catch (error) {
    next(error); // Passa o erro para o errorHandler.js
  }
};

// POST /disparar - Disparar notificação (Apenas professores)
export const sendToAll = async (req, res, next) => {
  try {
    // Validação de segurança: apenas PROFESSOR pode disparar
    if (req.usuario.tipo !== 'PROFESSOR') {
      return res.status(403).json({ erro: "Acesso negado. Apenas professores podem disparar notificações." });
    }

    const { title, body } = req.body;

    // Busca todos os tokens registados na base de dados via Prisma
    const tokens = await prisma.notificacaoToken.findMany();

    for (const t of tokens) {
      // O envio utiliza o serviço mockado/real que já existia
      await sendNotification(t.token, { title, body });
    }

    res.json({ sucesso: true, mensagem: "Notificações enviadas com sucesso" });
  } catch (error) {
    next(error);
  }
};

// GET /historico - Lista notificações enviadas ao utilizador logado
export const getHistorico = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    /*
     * NOTA: Para implementar totalmente esta query (ex: prisma.notificacao.findMany),
     * será necessário criar o modelo respetivo no schema.prisma.
     */

    res.status(200).json({
      sucesso: true,
      mensagem: "Rota de histórico criada. Requer modelo de Notificações no schema para listar os dados.",
      dados: []
    });
  } catch (error) {
    next(error);
  }
};