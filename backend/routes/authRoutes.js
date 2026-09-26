// Arquivo: backend/routes/authRoutes.js
import { Router } from 'express';
import { loginProfessor, loginAluno, getMe, refreshToken } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();

// Rotas públicas
router.post('/login/professor', loginProfessor);
router.post('/login/aluno', loginAluno);
router.post('/refresh', refreshToken);

// Rotas protegidas
router.get('/me', verificarToken, getMe);

export default router;