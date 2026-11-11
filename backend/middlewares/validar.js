import { ApiError } from "./errorHandler.js";

export const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body ?? {});
  if (!resultado.success) {
    return next(new ApiError(400, resultado.error.issues[0]?.message ?? "Dados inválidos"));
  }
  req.body = resultado.data;
  next();
};

// Valida os parâmetros da URL (:id) sem alterar req.params
export const validarParams = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.params ?? {});
  if (!resultado.success) {
    return next(new ApiError(400, "Identificador inválido"));
  }
  next();
};