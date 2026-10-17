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
import { limiteLogin, limiteCadastro } from "../middlewares/rateLimit.js";
import { loginSchema, cadastroSchema } from "../schemas/authSchemas.js";

const router = Router();

// Rotas públicas
router.post("/login/professor", limiteLogin, validar(loginSchema), loginProfessor);
router.post("/login/aluno", limiteLogin, validar(loginSchema), loginAluno);
router.post("/register/professor", limiteCadastro, validar(cadastroSchema), registrarProfessor);
router.post("/register/aluno", limiteCadastro, validar(cadastroSchema), registrarAluno);
router.post("/refresh", refreshToken); // será protegida na fase 3

// Rotas protegidas
router.get("/me", verificarToken, getMe);

export default router;