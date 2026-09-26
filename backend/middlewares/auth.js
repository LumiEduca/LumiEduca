import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";
import prisma from '../config/prismaClient.js';

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Token não fornecido', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca o usuário para garantir que ele ainda existe
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new ApiError('Usuário não encontrado', 401);
    }

    const { senhaHash, ...usuarioSemSenha } = user;
    req.usuario = usuarioSemSenha; // Disponibiliza para as próximas rotas
    
    next();
  } catch (error) {
    next(new ApiError('Token inválido ou expirado', 401));
  }
};