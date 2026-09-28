import express from "express";
import {
  saveToken,
  sendToAll,
  getHistorico
} from "../controllers/notificationController.js";
import auth from "../middlewares/auth.js"; // Assumindo export default auth (ou altere para { auth } se for named export)

const router = express.Router();

// Rotas protegidas pelo middleware auth
router.post("/token", auth, saveToken);
router.post("/disparar", auth, sendToAll);
router.get("/historico", auth, getHistorico);

export default router;