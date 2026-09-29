import { Router } from "express";
import { verificarToken, exigirTipo } from "../middlewares/auth.js";
import * as progressoController from "../controllers/progressoController.js";

const router = Router();

router.post("/responder", verificarToken, exigirTipo("ALUNO"), progressoController.responder);
router.get("/aluno/:id", verificarToken, progressoController.progressoDoAluno);
router.get("/trilha", verificarToken, exigirTipo("ALUNO"), progressoController.trilha);

export default router;