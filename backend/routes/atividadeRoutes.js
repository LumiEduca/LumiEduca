import express from "express";
import {
  criarAtividade,
  listarAtividades,
  obterAtividade,
} from "../controllers/atividadeController.js";
import { exigirTipo, verificarToken } from "../middlewares/auth.js";
import { validar, validarParams } from "../middlewares/validar.js";
import { idParamSchema } from "../schemas/comumSchemas.js";
import { criarAtividadeSchema } from "../schemas/atividadeSchemas.js";

const router = express.Router();

router.post(
  "/",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validar(criarAtividadeSchema),
  criarAtividade
);
router.get("/", verificarToken, exigirTipo("PROFESSOR"), listarAtividades);
router.get("/:id", verificarToken, validarParams(idParamSchema), obterAtividade);

export default router;