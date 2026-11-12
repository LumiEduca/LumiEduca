import { z } from "zod";

export const JOGOS_DEMO = ["caca-palavras", "memoria", "quiz"];

export const avaliacaoDemoSchema = z.object({
  jogo: z.enum(JOGOS_DEMO),
  nota: z
    .number()
    .int("A nota deve ser um número inteiro")
    .min(1, "A nota deve ser de 1 a 5")
    .max(5, "A nota deve ser de 1 a 5"),
});