import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";

export const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Token não fornecido"));
  }

  try {
    const token = header.split(" ")[1];

    req.usuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch {
    next(new ApiError(401, "Token inválido"));
  }
};