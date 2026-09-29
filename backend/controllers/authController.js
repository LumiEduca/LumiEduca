import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { JWT_SECRET } from "../lib/env.js";

export async function login(req, res) {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Informe usuário e senha." });
  }

  const usuarioEncontrado = await prisma.usuario.findUnique({
    where: { usuario: String(usuario).trim() },
  });

  if (!usuarioEncontrado) {
    return res.status(401).json({ erro: "Usuário ou senha inválidos." });
  }

  const senhaValida = await bcrypt.compare(senha, usuarioEncontrado.senha);

  if (!senhaValida) {
    return res.status(401).json({ erro: "Usuário ou senha inválidos." });
  }

  const payload = {
    id: usuarioEncontrado.id,
    nome: usuarioEncontrado.nome,
    tipo: usuarioEncontrado.tipo,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, usuario: payload });
}

export async function me(req, res) {
  res.json({ usuario: req.usuario });
}
