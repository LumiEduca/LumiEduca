import express from "express";
import {
  criarAtividade,
  listarAtividades,
  obterAtividade,
  editarAtividade,
  excluirAtividade,
} from "../controllers/atividadeController.js";
import { exigirTipo, verificarToken } from "../middlewares/auth.js";
import { validar, validarParams } from "../middlewares/validar.js";
import { idParamSchema } from "../schemas/comumSchemas.js";
import {
  criarAtividadeSchema,
  editarAtividadeSchema,
} from "../schemas/atividadeSchemas.js";

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
router.patch(
  "/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  validar(editarAtividadeSchema),
  editarAtividade
);
router.delete(
  "/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  excluirAtividade
);

export default router;