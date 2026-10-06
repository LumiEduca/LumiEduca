// Arquivo: backend/services/authService.js
import prisma from '../config/prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../middlewares/errorHandler.js';

export const autenticarUsuario = async (usuario, senha, tipo) => {
  // Busca o usuário no banco de dados usando o Prisma centralizado
  const user = await prisma.usuario.findUnique({
    where: { usuario }
  });

  if (!user || user.tipo !== tipo) {
    throw new ApiError(401, 'Usuário não encontrado ou tipo incorreto');
  }

  // Validação da senha utilizando bcryptjs
  const senhaValida = await bcrypt.compare(senha, user.senhaHash);
  if (!senhaValida) {
    throw new ApiError(401, 'Credenciais inválidas');
  }

  // Geração do token JWT
  const token = jwt.sign(
    { id: user.id, tipo: user.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Expiração padrão, ajuste conforme a necessidade do projeto
  );

  // Retorna os dados sem expor a senhaHash
  const { senhaHash, ...usuarioSemSenha } = user;
  return { usuario: usuarioSemSenha, token };
};

const SALT_ROUNDS = 10;

function validarCadastro({ nome, usuario, senha }) {
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100) {
    throw new ApiError(400, 'Nome deve ter entre 2 e 100 caracteres');
  }
  if (typeof usuario !== 'string' || !/^[A-Za-z0-9._]{3,30}$/.test(usuario.trim())) {
    throw new ApiError(400, 'Usuário deve ter de 3 a 30 caracteres (letras, números, ponto ou underline)');
  }
  if (typeof senha !== 'string' || senha.length < 6 || senha.length > 72) {
    throw new ApiError(400, 'Senha deve ter entre 6 e 72 caracteres');
  }
}

export const registrarUsuario = async ({ nome, usuario, senha, tipo }) => {
  validarCadastro({ nome, usuario, senha });

  const usuarioLimpo = usuario.trim();

  const existente = await prisma.usuario.findUnique({ where: { usuario: usuarioLimpo } });
  if (existente) {
    throw new ApiError(409, 'Esse usuário já está em uso');
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  try {
    const novo = await prisma.usuario.create({
      data: { nome: nome.trim(), usuario: usuarioLimpo, senhaHash, tipo },
    });

    const token = jwt.sign(
      { id: novo.id, tipo: novo.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { senhaHash: _omit, ...usuarioSemSenha } = novo;
    return { usuario: usuarioSemSenha, token };
  } catch (error) {
    // Dois cadastros simultâneos com o mesmo usuário
    if (error.code === 'P2002') {
      throw new ApiError(409, 'Esse usuário já está em uso');
    }
    throw error;
  }
};