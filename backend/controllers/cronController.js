import crypto from "node:crypto";
import { ApiError } from "../middlewares/errorHandler.js";
import { enviarLembretesDePrazo } from "../services/lembreteService.js";

const hash = (valor) => crypto.createHash("sha256").update(String(valor)).digest();

const chaveValida = (req) => {
  const esperada = process.env.CRON_SECRET;
  if (!esperada) return false;

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return false;

  return crypto.timingSafeEqual(hash(header.slice(7).trim()), hash(esperada));
};

// GET /cron/lembretes - chamado pelo Vercel Cron
export const executarLembretes = async (req, res, next) => {
  try {
    if (!chaveValida(req)) throw new ApiError(401, "Não autorizado");

    const resultado = await enviarLembretesDePrazo();
    res.status(200).json({ sucesso: true, ...resultado });
  } catch (error) {
    next(error);
  }
};