import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";
import prisma from "../config/prismaClient.js";

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Token não fornecido");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ApiError(401, "Token inválido ou expirado");
    }

    // Busca o usuário para garantir que ele ainda existe
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ApiError(401, "Usuário não encontrado");
    }

    const { senhaHash, ...usuarioSemSenha } = user;
    req.usuario = usuarioSemSenha; // Disponibiliza para as próximas rotas

    next();
  } catch (error) {
    next(error);
  }
};

// Autorização por tipo de usuário (enum TipoUsuario do schema: "PROFESSOR" | "ALUNO")
export const exigirTipo = (tipo) => (req, res, next) => {
  if (req.usuario?.tipo !== tipo) {
    return next(
      new ApiError(403, `Apenas ${tipo === "PROFESSOR" ? "professor" : "aluno"} pode acessar esta rota`)
    );
  }
  next();
};