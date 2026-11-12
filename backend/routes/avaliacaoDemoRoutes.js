import express from "express";
import { criar, resumo } from "../controllers/avaliacaoDemoController.js";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { limiteAvaliacaoDemo } from "../middlewares/rateLimit.js";
import { avaliacaoDemoSchema } from "../schemas/avaliacaoDemoSchemas.js";

const router = express.Router();

// Pública (sem login): usada pelas demos
router.post("/avaliacoes", limiteAvaliacaoDemo, validar(avaliacaoDemoSchema), criar);

// Protegida: só professor vê o resumo
router.get("/avaliacoes/resumo", verificarToken, exigirTipo("PROFESSOR"), resumo);

export default router;