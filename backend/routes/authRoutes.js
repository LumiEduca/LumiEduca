import { Router } from "express";
import {
  loginProfessor,
  loginAluno,
  registrarProfessor,
  registrarAluno,
  getMe,
  refreshToken,
} from "../controllers/authController.js";
import { verificarToken } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { limiteLogin, limiteCadastro, limiteRefresh } from "../middlewares/rateLimit.js";
import { loginSchema, cadastroSchema } from "../schemas/authSchemas.js";

const router = Router();

// Rotas públicas
router.post("/login/professor", limiteLogin, validar(loginSchema), loginProfessor);
router.post("/login/aluno", limiteLogin, validar(loginSchema), loginAluno);
router.post("/register/professor", limiteCadastro, validar(cadastroSchema), registrarProfessor);
router.post("/register/aluno", limiteCadastro, validar(cadastroSchema), registrarAluno);

// Rotas protegidas
router.get("/me", verificarToken, getMe);
router.get("/me", verificarToken, getMe);
router.post("/refresh", verificarToken, limiteRefresh, refreshToken);

export default router;