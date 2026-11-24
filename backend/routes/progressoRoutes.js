import { Router } from "express";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import { validar, validarParams } from "../middlewares/validar.js";
import { idParamSchema } from "../schemas/comumSchemas.js";
import { responderSchema } from "../schemas/progressoSchemas.js";
import * as progressoController from "../controllers/progressoController.js";

const router = Router();

router.post(
  "/responder",
  verificarToken,
  exigirTipo("ALUNO"),
  validar(responderSchema),
  progressoController.responder
);
router.get(
  "/aluno/:id",
  verificarToken,
  validarParams(idParamSchema),
  progressoController.progressoDoAluno
);
router.get(
  "/trilha", 
  verificarToken, 
  exigirTipo("ALUNO"), 
  progressoController.trilha
);
router.get(
  "/conquistas",
  verificarToken,
  exigirTipo("ALUNO"),
  progressoController.conquistas
);

export default router;