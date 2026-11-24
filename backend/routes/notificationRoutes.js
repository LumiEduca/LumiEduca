import express from "express";
import {
  saveToken,
  removeToken,
  sendToAll,
  getHistorico,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
} from "../controllers/notificationController.js";
import { executarLembretes } from "../controllers/cronController.js";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import { validar, validarParams } from "../middlewares/validar.js";
import { limiteDisparo, limiteCron } from "../middlewares/rateLimit.js";
import { idParamSchema } from "../schemas/comumSchemas.js";
import { tokenSchema, disparoSchema } from "../schemas/notificacaoSchemas.js";

const router = express.Router();

router.post("/token", verificarToken, validar(tokenSchema), saveToken);
router.delete("/token", verificarToken, validar(tokenSchema), removeToken);
router.post(
  "/disparar",
  verificarToken,
  exigirTipo("PROFESSOR"),
  limiteDisparo,
  validar(disparoSchema),
  sendToAll
);
router.get("/historico", verificarToken, getHistorico);
router.get("/nao-lidas/contagem", verificarToken, contarNaoLidas);
router.patch("/lidas", verificarToken, marcarTodasComoLidas);
router.patch("/:id/lida", verificarToken, validarParams(idParamSchema), marcarComoLida);

// Cron (Vercel): protegido por CRON_SECRET, sem login de usuário
router.get("/cron/lembretes", limiteCron, executarLembretes);

export default router;