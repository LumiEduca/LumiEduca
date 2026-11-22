import { z } from "zod";

// Teto de questões por chamada: controla custo de tokens e tempo de resposta da Gemini.
export const LIMITE_QUESTOES_GERADAS = 10;

const texto = (campo, max) =>
  z
    .string({ error: `O campo '${campo}' é obrigatório e deve ser um texto.` })
    .trim()
    .min(1, `O campo '${campo}' é obrigatório e deve ser um texto.`)
    .max(max, `O campo '${campo}' deve ter no máximo ${max} caracteres.`);

// ---------- ENTRADA: POST /lumi/gerar-questoes ----------
export const gerarQuestoesSchema = z.object({
  tema: texto("tema", 200),
  materia: texto("materia", 80),
  quantidade: z
    .number({
      error: "O campo 'quantidade' é obrigatório e deve ser um número.",
    })
    .int("O campo 'quantidade' deve ser um número inteiro.")
    .min(1, "O campo 'quantidade' deve ser pelo menos 1.")
    .max(
      LIMITE_QUESTOES_GERADAS,
      `O campo 'quantidade' deve ser no máximo ${LIMITE_QUESTOES_GERADAS}.`,
    ),
  nivel: z.enum(["facil", "medio", "dificil"], {
    error: "O campo 'nivel' deve ser 'facil', 'medio' ou 'dificil'.",
  }),
});

// ---------- SAÍDA DO GEMINI: validada ANTES de devolver ao professor ----------
// Mesmo formato que POST /atividades espera (respostaCorreta = índice da opção, a partir de 0).
const questaoGeradaSchema = z
  .object({
    enunciado: texto("enunciado", 1000),
    opcoes: z
      .array(texto("opcao", 300), {
        error: "A questão gerada precisa de uma lista de opções.",
      })
      .min(2, "A questão gerada precisa de pelo menos duas opções.")
      .max(6, "A questão gerada pode ter no máximo 6 opções."),
    respostaCorreta: z
      .number({ error: "A questão gerada precisa de uma resposta correta." })
      .int("A resposta correta deve ser um índice inteiro."),
  })
  .refine(
    (q) => q.respostaCorreta >= 0 && q.respostaCorreta < q.opcoes.length,
    {
      error: "A resposta correta deve indicar uma opção existente.",
      path: ["respostaCorreta"],
    },
  );

export const questoesGeradasSchema = z.object({
  questoes: z
    .array(questaoGeradaSchema, {
      error: "O Gemini deve devolver uma lista de questões.",
    })
    .min(1, "O Gemini não devolveu nenhuma questão.")
    .max(LIMITE_QUESTOES_GERADAS, "O Gemini devolveu questões demais."),
});

// ---------- ENTRADA: POST /lumi/explicar-erro ----------
// Mesmo formato de POST /progresso/responder: resposta = índice da opção marcada.
export const explicarErroSchema = z.object({
  questaoId: z
    .string({ error: "O campo 'questaoId' é obrigatório." })
    .regex(/^[A-Za-z0-9_-]{1,64}$/, "O campo 'questaoId' é inválido."),
  resposta: z.union(
    [
      z
        .string()
        .trim()
        .min(1, "O campo 'resposta' é obrigatório.")
        .max(300, "O campo 'resposta' deve ter no máximo 300 caracteres."),
      z.number().int().min(0).max(1000),
    ],
    { error: "O campo 'resposta' é obrigatório." },
  ),
});
