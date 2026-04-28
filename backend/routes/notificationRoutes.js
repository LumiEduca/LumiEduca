import express from "express";
import {
  saveToken,
  sendToAll
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/save-token", saveToken);
router.post("/send", sendToAll);

export default router;