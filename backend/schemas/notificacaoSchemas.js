import { z } from "zod";

const idSala = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Identificador de sala inválido");

export const tokenSchema = z.object({
  token: z
    .string({ error: "O token é obrigatório" })
    .trim()
    .min(20, "Token inválido")
    .max(4096, "Token inválido"),
});

export const disparoSchema = z.object({
  title: z
    .string({ error: "O título da notificação é obrigatório e não pode ser vazio." })
    .trim()
    .min(1, "O título da notificação é obrigatório e não pode ser vazio.")
    .max(100, "O título deve ter no máximo 100 caracteres"),
  body: z
    .string({ error: "O corpo da notificação é obrigatório e não pode ser vazio." })
    .trim()
    .min(1, "O corpo da notificação é obrigatório e não pode ser vazio.")
    .max(500, "O corpo deve ter no máximo 500 caracteres"),
  salaId: idSala.nullish(),
});