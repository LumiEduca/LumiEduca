import express from "express";
import {
  criarSala,
  listarSalas,
  detalharSala,
  entrarNaSala,
  removerSala,
} from "../controllers/salaController.js";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verificarToken, exigirTipo("PROFESSOR"), criarSala);
router.get("/", verificarToken, exigirTipo("PROFESSOR"), listarSalas);
router.post("/entrar", verificarToken, exigirTipo("ALUNO"), entrarNaSala);
router.get("/:id", verificarToken, detalharSala);
router.delete("/:id", verificarToken, exigirTipo("PROFESSOR"), removerSala);

export default router;