import express from "express";
import { login, me } from "../controllers/authController.js";
import { autenticar } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", autenticar, me);

export default router;
