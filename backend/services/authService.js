import prisma from "../config/prismaClient.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../middlewares/errorHandler.js";
import { assinarToken } from "../config/jwt.js";

const SALT_ROUNDS = 10;
// Hash falso: o login gasta o mesmo tempo quando o usuário não existe
const HASH_FALSO = bcrypt.hashSync("hash-falso-para-tempo-constante", SALT_ROUNDS);

export const autenticarUsuario = async (usuario, senha, tipo) => {
  const user = await prisma.usuario.findUnique({ where: { usuario } });

  const tipoCerto = Boolean(user) && user.tipo === tipo;
  const senhaValida = await bcrypt.compare(senha, tipoCerto ? user.senhaHash : HASH_FALSO);

  // Mensagem única: não revela se o usuário existe nem se o tipo está errado
  if (!tipoCerto || !senhaValida) {
    throw new ApiError(401, "Usuário ou senha inválidos");
  }

  const token = assinarToken({ id: user.id, tipo: user.tipo });

  const { senhaHash, ...usuarioSemSenha } = user;
  return { usuario: usuarioSemSenha, token };
};

export const registrarUsuario = async ({ nome, usuario, senha, tipo }) => {
  const usuarioLimpo = usuario.trim();

  const existente = await prisma.usuario.findUnique({ where: { usuario: usuarioLimpo } });
  if (existente) {
    throw new ApiError(409, "Esse usuário já está em uso");
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  try {
    const novo = await prisma.usuario.create({
      data: { nome: nome.trim(), usuario: usuarioLimpo, senhaHash, tipo },
    });

    const token = assinarToken({ id: novo.id, tipo: novo.tipo });

    const { senhaHash: _omit, ...usuarioSemSenha } = novo;
    return { usuario: usuarioSemSenha, token };
  } catch (error) {
    // Dois cadastros simultâneos com o mesmo usuário
    if (error.code === "P2002") {
      throw new ApiError(409, "Esse usuário já está em uso");
    }
    throw error;
  }
};