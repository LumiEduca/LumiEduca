import jwt from "jsonwebtoken";

const ALGORITMO = "HS256";
let avisou = false;

function segredo() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET não configurado");
  if (s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres");
    }
    if (!avisou) {
      console.warn("[aviso] JWT_SECRET curto (menos de 32 caracteres). Use um segredo forte.");
      avisou = true;
    }
  }
  return s;
}

export const assinarToken = (payload) =>
  jwt.sign(payload, segredo(), { algorithm: ALGORITMO, expiresIn: "1d" });

export const lerToken = (token) =>
  jwt.verify(token, segredo(), { algorithms: [ALGORITMO] });