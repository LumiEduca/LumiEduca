import { z } from "zod";

const senhaMaxima = (s) => Buffer.byteLength(s, "utf8") <= 72; // limite real do bcrypt

export const loginSchema = z.object({
  usuario: z
    .string({ error: "Usuário e senha são obrigatórios" })
    .trim()
    .min(1, "Usuário e senha são obrigatórios")
    .max(30, "Usuário ou senha inválidos"),
  senha: z
    .string({ error: "Usuário e senha são obrigatórios" })
    .min(1, "Usuário e senha são obrigatórios")
    .refine(senhaMaxima, "Usuário ou senha inválidos"),
});

export const cadastroSchema = z.object({
  nome: z
    .string({ error: "Nome, usuário e senha são obrigatórios" })
    .trim()
    .min(2, "Nome deve ter entre 2 e 100 caracteres")
    .max(100, "Nome deve ter entre 2 e 100 caracteres"),
  usuario: z
    .string({ error: "Nome, usuário e senha são obrigatórios" })
    .trim()
    .regex(
      /^[A-Za-z0-9._]{3,30}$/,
      "Usuário deve ter de 3 a 30 caracteres (letras, números, ponto ou underline)"
    ),
  senha: z
    .string({ error: "Nome, usuário e senha são obrigatórios" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .refine(senhaMaxima, "A senha é longa demais (máximo de 72 caracteres)"),
});

export const MSG_TROCA_SENHA =
  "Não foi possível alterar a senha. Verifique os dados informados.";

export const atualizarPerfilSchema = z.object({
  nome: z
    .string({ error: "Nome deve ter entre 2 e 100 caracteres" })
    .trim()
    .min(2, "Nome deve ter entre 2 e 100 caracteres")
    .max(100, "Nome deve ter entre 2 e 100 caracteres"),
});

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z
      .string({ error: MSG_TROCA_SENHA })
      .min(1, MSG_TROCA_SENHA)
      .refine(senhaMaxima, MSG_TROCA_SENHA),
    novaSenha: z
      .string({ error: MSG_TROCA_SENHA })
      .min(8, MSG_TROCA_SENHA)
      .refine(senhaMaxima, MSG_TROCA_SENHA),
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: MSG_TROCA_SENHA,
    path: ["novaSenha"],
  });