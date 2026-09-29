import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/env.js";
import { TIPOS } from "../lib/constants.js";

export function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Token ausente ou inválido." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: payload.id, nome: payload.nome, tipo: payload.tipo };
    next();
  } catch {
    return res.status(401).json({ erro: "Token ausente ou inválido." });
  }
}

export function requireProfessor(req, res, next) {
  if (req.usuario?.tipo !== TIPOS.PROFESSOR) {
    return res.status(403).json({ erro: "Acesso restrito a professores." });
  }
  next();
}

export function requireAluno(req, res, next) {
  if (req.usuario?.tipo !== TIPOS.ALUNO) {
    return res.status(403).json({ erro: "Acesso restrito a alunos." });
  }
  next();
}
