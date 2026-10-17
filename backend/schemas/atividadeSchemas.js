import { z } from "zod";

const texto = (campo, max) =>
  z
    .string({ error: `O campo '${campo}' é obrigatório e deve ser um texto.` })
    .trim()
    .min(1, `O campo '${campo}' é obrigatório e deve ser um texto.`)
    .max(max, `O campo '${campo}' deve ter no máximo ${max} caracteres.`);

const questaoSchema = z.object({
  enunciado: texto("enunciado", 1000),
  opcoes: z
    .array(texto("opcao", 300), { error: "Cada questão deve ter pelo menos duas opções." })
    .min(2, "Cada questão deve ter pelo menos duas opções.")
    .max(6, "Cada questão pode ter no máximo 6 opções."),
  // O controller confere se é um índice de opção existente
  respostaCorreta: z.union([z.number(), z.string()], {
    error: "Informe a resposta correta de cada questão.",
  }),
});

export const criarAtividadeSchema = z.object({
  titulo: texto("titulo", 150),
  materia: texto("materia", 80),
  prazo: z.union([z.string().max(40), z.null()]).optional(),
  questoes: z
    .array(questaoSchema, { error: "Informe pelo menos uma questão." })
    .min(1, "Informe pelo menos uma questão.")
    .max(50, "Uma atividade pode ter no máximo 50 questões."),
});