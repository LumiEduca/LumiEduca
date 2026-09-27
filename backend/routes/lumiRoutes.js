import express from "express";
import { dica, status } from "../controllers/lumiController.js";
import { verificarToken } from "../middlewares/auth.js";

const router = express.Router();

// Pública — usada pelo frontend para checar disponibilidade antes de chamar /dica
router.get("/status", status);

// Protegida — exige Authorization: Bearer <token>
router.post("/dica", verificarToken, dica);

export default router;
