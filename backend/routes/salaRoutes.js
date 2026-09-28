import express from "express";
import {
  criarSala,
  listarSalas,
  detalharSala,
  entrarNaSala,
  removerSala,
} from "../controllers/salaController.js";
import { autenticar, exigirPapel } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", autenticar, exigirPapel("professor"), criarSala);
router.get("/", autenticar, exigirPapel("professor"), listarSalas);
router.post("/entrar", autenticar, exigirPapel("aluno"), entrarNaSala);
router.get("/:id", autenticar, detalharSala);
router.delete("/:id", autenticar, exigirPapel("professor"), removerSala);

export default router;