import { ApiError } from "./errorHandler.js";
import prisma from "../config/prismaClient.js";
import { lerToken } from "../config/jwt.js";

const ERROS_DO_TOKEN = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"];

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Token não fornecido");
    }

    const token = authHeader.slice(7).trim();

    let decoded;
    try {
      decoded = lerToken(token);
    } catch (error) {
      if (ERROS_DO_TOKEN.includes(error.name)) {
        throw new ApiError(401, "Token inválido ou expirado");
      }
      throw error;
    }

    if (typeof decoded.id !== "string") {
      throw new ApiError(401, "Token inválido ou expirado");
    }

    // Garante que o usuário ainda existe e que o tipo do token bate com o do banco
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      omit: { senhaHash: true },
    });

    if (!user || user.tipo !== decoded.tipo) {
      throw new ApiError(401, "Token inválido ou expirado");
    }

    req.usuario = user;
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