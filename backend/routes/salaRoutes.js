import express from "express";
import {
  criarSala,
  listarSalas,
  entrarNaSala,
  vincularAtividade,
  desvincularAtividade,
  listarAtividadesDaSala,
} from "../controllers/salaController.js";
import { autenticar, requireProfessor, requireAluno } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", autenticar, requireProfessor, criarSala);
router.get("/", autenticar, listarSalas);
router.post("/entrar", autenticar, requireAluno, entrarNaSala);
router.post("/:id/atividades", autenticar, requireProfessor, vincularAtividade);
router.get("/:id/atividades", autenticar, listarAtividadesDaSala);
router.delete(
  "/:id/atividades/:atividadeId",
  autenticar,
  requireProfessor,
  desvincularAtividade
);

export default router;
