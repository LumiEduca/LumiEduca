import { z } from "zod";

export const criarSalaSchema = z.object({
  nome: z
    .string({ error: "O nome da sala é obrigatório" })
    .trim()
    .min(1, "O nome da sala é obrigatório")
    .max(100, "O nome da sala deve ter no máximo 100 caracteres"),
});

export const entrarSalaSchema = z.object({
  codigo: z
    .string({ error: "Informe o código de acesso" })
    .trim()
    .min(1, "Informe o código de acesso")
    .max(20, "Código de acesso inválido"),
});