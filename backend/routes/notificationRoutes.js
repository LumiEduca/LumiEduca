import express from "express";
import { saveToken, sendToAll, getHistorico } from "../controllers/notificationController.js";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { limiteDisparo } from "../middlewares/rateLimit.js";
import { tokenSchema, disparoSchema } from "../schemas/notificacaoSchemas.js";

const router = express.Router();

router.post("/token", verificarToken, validar(tokenSchema), saveToken);
router.post(
  "/disparar",
  verificarToken,
  exigirTipo("PROFESSOR"),
  limiteDisparo,
  validar(disparoSchema),
  sendToAll
);
router.get("/historico", verificarToken, getHistorico);

export default router;