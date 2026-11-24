import express from "express";
import {
  criarDesafio,
  listarDesafios,
  responderDesafio,
  removerDesafio,
} from "../controllers/desafioController.js";
import { exigirTipo, verificarToken } from "../middlewares/auth.js";
import { validarParams } from "../middlewares/validar.js";
import { idParamSchema } from "../schemas/comumSchemas.js";

const router = express.Router();

router.post("/", verificarToken, exigirTipo("PROFESSOR"), criarDesafio);
router.get("/", verificarToken, listarDesafios);
router.post(
  "/:id/responder",
  verificarToken,
  exigirTipo("ALUNO"),
  validarParams(idParamSchema),
  responderDesafio
);
router.delete(
  "/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  removerDesafio
);

export default router;