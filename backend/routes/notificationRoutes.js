import express from "express";
import { saveToken } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/save-token", saveToken);

export default router;