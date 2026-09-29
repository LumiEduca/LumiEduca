import express from "express";
import {
  criarAtividade,
  listarAtividades,
  obterAtividade,
} from "../controllers/atividadeController.js";
import { autenticar, requireProfessor } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", autenticar, requireProfessor, criarAtividade);
router.get("/", autenticar, requireProfessor, listarAtividades);
router.get("/:id", autenticar, obterAtividade);

export default router;
