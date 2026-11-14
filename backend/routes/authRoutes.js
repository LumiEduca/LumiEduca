import { Router } from "express";
import {
  loginProfessor,
  loginAluno,
  registrarProfessor,
  registrarAluno,
  getMe,
  refreshToken,
  atualizarMe,
  trocarSenha,
} from "../controllers/authController.js";
import { verificarToken } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import {
  limiteLogin,
  limiteCadastro,
  limiteRefresh,
  limiteSenha,
} from "../middlewares/rateLimit.js";
import {
  loginSchema,
  cadastroSchema,
  atualizarPerfilSchema,
  trocarSenhaSchema,
} from "../schemas/authSchemas.js";

const router = Router();

// Rotas públicas
router.post("/login/professor", limiteLogin, validar(loginSchema), loginProfessor);
router.post("/login/aluno", limiteLogin, validar(loginSchema), loginAluno);
router.post("/register/professor", limiteCadastro, validar(cadastroSchema), registrarProfessor);
router.post("/register/aluno", limiteCadastro, validar(cadastroSchema), registrarAluno);

// Rotas protegidas
router.get("/me", verificarToken, getMe);
router.patch("/me", verificarToken, validar(atualizarPerfilSchema), atualizarMe);
router.patch("/senha", verificarToken, limiteSenha, validar(trocarSenhaSchema), trocarSenha);
router.post("/refresh", verificarToken, limiteRefresh, refreshToken);

export default router;