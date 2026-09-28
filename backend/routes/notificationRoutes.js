import express from "express";
import {
  saveToken,
  sendToAll,
  getHistorico
} from "../controllers/notificationController.js";
import { verificarToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/token", verificarToken, saveToken);
router.post("/disparar", verificarToken, sendToAll);
router.get("/historico", verificarToken, getHistorico);

export default router;