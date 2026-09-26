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
    throw new ApiError('Usuário não encontrado ou tipo incorreto', 401);
  }

  // Validação da senha utilizando bcryptjs
  const senhaValida = await bcrypt.compare(senha, user.senhaHash);
  if (!senhaValida) {
    throw new ApiError('Credenciais inválidas', 401);
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