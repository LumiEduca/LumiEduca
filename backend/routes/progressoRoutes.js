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
router.get(
  "/streak",
  verificarToken,
  exigirTipo("ALUNO"),
  progressoController.streak
);
router.get(
  "/relatorio/sala/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  progressoController.relatorioDaSala
);

router.get(
  "/streak",
  verificarToken,
  exigirTipo("ALUNO"),
  progressoController.streak
);
router.get(
  "/relatorio/sala/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  progressoController.relatorioDaSala
);


export default router;