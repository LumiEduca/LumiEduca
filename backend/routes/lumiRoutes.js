import express from "express";
import rateLimit from "express-rate-limit";
import { dica, status } from "../controllers/lumiController.js";
import { verificarToken } from "../middlewares/auth.js";

const router = express.Router();

// Mantém o formato de erro do projeto: { "erro": "mensagem" }
const responder429 = (mensagem) => (req, res) => {
  res.status(429).json({ erro: mensagem });
};

// /dica — limite por USUÁRIO (precisa vir DEPOIS do verificarToken, que preenche req.usuario)
const limiteDicasPorMinuto = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.usuario.id,
  handler: responder429("Muitas dicas em pouco tempo. Tente novamente em instantes."),
});

// /dica — teto diário por usuário
const limiteDicasPorDia = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.usuario.id,
  handler: responder429("Você atingiu o limite diário de dicas. Volte amanhã!"),
});

// /status — limite por IP (chave padrão do express-rate-limit)
const limiteStatusPorIp = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: responder429("Muitas requisições. Tente novamente em instantes."),
});

// Pública
router.get("/status", limiteStatusPorIp, status);

// Protegida: autentica -> limita por usuário -> valida/gera no controller
router.post("/dica", verificarToken, limiteDicasPorMinuto, limiteDicasPorDia, dica);

export default router;
