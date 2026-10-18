import { z } from "zod";

export const responderSchema = z.object({
  questaoId: z
    .string({ error: "questaoId e resposta são obrigatórios" })
    .regex(/^[A-Za-z0-9_-]{1,64}$/, "questaoId inválido"),
  resposta: z.union(
    [
      z.string().trim().min(1, "questaoId e resposta são obrigatórios").max(300, "A resposta deve ter no máximo 300 caracteres"),
      z.number().int().min(0).max(1000),
    ],
    { error: "questaoId e resposta são obrigatórios" }
  ),
});