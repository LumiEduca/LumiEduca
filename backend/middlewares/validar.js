import { ApiError } from "./errorHandler.js";

export const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body ?? {});
  if (!resultado.success) {
    return next(new ApiError(400, resultado.error.issues[0]?.message ?? "Dados inválidos"));
  }
  req.body = resultado.data;
  next();
};