import express from "express";
import {
  criarSala,
  listarSalas,
  detalharSala,
  entrarNaSala,
  removerSala,
  editarSala,
  removerAluno,
  sairDaSala,
  rankingDaSala,
} from "../controllers/salaController.js";
import {
  associarAtividade,
  listarAtividadesDaSala,
} from "../controllers/salaAtividadeController.js";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import { validar, validarParams } from "../middlewares/validar.js";
import { limiteEntrarSala } from "../middlewares/rateLimit.js";
import { idParamSchema } from "../schemas/comumSchemas.js";
import {
  criarSalaSchema,
  entrarSalaSchema,
  editarSalaSchema,
  salaAlunoParamsSchema,
} from "../schemas/salaSchemas.js";

const router = express.Router();

router.post("/", verificarToken, exigirTipo("PROFESSOR"), validar(criarSalaSchema), criarSala);
router.get("/", verificarToken, exigirTipo("PROFESSOR"), listarSalas);
router.post(
  "/entrar",
  verificarToken,
  exigirTipo("ALUNO"),
  limiteEntrarSala,
  validar(entrarSalaSchema),
  entrarNaSala
);
router.post(
  "/:id/atividades",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  associarAtividade
);
router.get("/:id/atividades", verificarToken, validarParams(idParamSchema), listarAtividadesDaSala);
router.get("/:id/ranking", verificarToken, validarParams(idParamSchema), rankingDaSala);
router.get("/:id", verificarToken, validarParams(idParamSchema), detalharSala);
router.patch(
  "/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  validar(editarSalaSchema),
  editarSala
);
router.delete(
  "/:id/alunos/:alunoId",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(salaAlunoParamsSchema),
  removerAluno
);
router.delete(
  "/:id/sair",
  verificarToken,
  exigirTipo("ALUNO"),
  validarParams(idParamSchema),
  sairDaSala
);
router.delete(
  "/:id",
  verificarToken,
  exigirTipo("PROFESSOR"),
  validarParams(idParamSchema),
  removerSala
);

export default router;