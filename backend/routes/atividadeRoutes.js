import express from "express";
import {
  criarAtividade,
  listarAtividades,
  obterAtividade,
} from "../controllers/atividadeController.js";
import { exigirTipo, verificarToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verificarToken, exigirTipo("PROFESSOR"), criarAtividade);
router.get("/", verificarToken, exigirTipo("PROFESSOR"), listarAtividades);
router.get("/:id", verificarToken, obterAtividade);

export default router;