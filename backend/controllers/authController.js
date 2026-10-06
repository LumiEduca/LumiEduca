// Arquivo: backend/controllers/authController.js
import * as authService from '../services/authService.js';
import { ApiError } from '../middlewares/errorHandler.js';

export const loginProfessor = async (req, res, next) => {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) throw new ApiError(400, 'Usuário e senha são obrigatórios');

    const resultado = await authService.autenticarUsuario(usuario, senha, 'PROFESSOR');
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const loginAluno = async (req, res, next) => {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) throw new ApiError(400, 'Usuário e senha são obrigatórios');

    const resultado = await authService.autenticarUsuario(usuario, senha, 'ALUNO');
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    // O req.usuario é injetado pelo middleware auth.js
    if (!req.usuario) throw new ApiError(401, 'Não autorizado');
    
    res.status(200).json({ usuario: req.usuario });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  // Implementação futura ou básica dependendo da estratégia de refresh (ex: token longo no DB ou apenas reemissão)
  res.status(200).json({ mensagem: "Rota de refresh a ser implementada com base na estratégia de sessão." });
};

export const registrarProfessor = async (req, res, next) => {
  try {
    const { nome, usuario, senha } = req.body;
    if (!nome || !usuario || !senha) throw new ApiError(400, 'Nome, usuário e senha são obrigatórios');

    const resultado = await authService.registrarUsuario({ nome, usuario, senha, tipo: 'PROFESSOR' });
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const registrarAluno = async (req, res, next) => {
  try {
    const { nome, usuario, senha } = req.body;
    if (!nome || !usuario || !senha) throw new ApiError(400, 'Nome, usuário e senha são obrigatórios');

    const resultado = await authService.registrarUsuario({ nome, usuario, senha, tipo: 'ALUNO' });
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
};