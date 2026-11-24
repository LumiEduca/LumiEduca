import { z } from "zod";

const texto = (campo, max) =>
  z
    .string({ error: `O campo '${campo}' é obrigatório e deve ser um texto.` })
    .trim()
    .min(1, `O campo '${campo}' é obrigatório e deve ser um texto.`)
    .max(max, `O campo '${campo}' deve ter no máximo ${max} caracteres.`);

const questaoSchema = z
  .object({
    enunciado: texto("enunciado", 1000),
    tipo: z
      .enum(["MULTIPLA_ESCOLHA", "VERDADEIRO_FALSO", "LACUNA"])
      .default("MULTIPLA_ESCOLHA"),
    opcoes: z
      .array(texto("opcao", 300), {
        error: "Cada questão deve ter pelo menos duas opções.",
      })
      .max(6, "Cada questão pode ter no máximo 6 opções.")
      .optional(),
    respostaCorreta: z.union([z.number(), z.string(), z.boolean()], {
      error: "Informe a resposta correta de cada questão.",
    }),
  })
  .superRefine((questao, ctx) => {
    if (questao.tipo === "MULTIPLA_ESCOLHA") {
      if (!questao.opcoes || questao.opcoes.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Cada questão deve ter pelo menos duas opções.",
          path: ["opcoes"],
        });
        return;
      }

      const resposta = Number(questao.respostaCorreta);
      if (
        !Number.isInteger(resposta) ||
        resposta < 0 ||
        resposta >= questao.opcoes.length
      ) {
        ctx.addIssue({
          code: "custom",
          message: "A resposta correta deve indicar uma opção existente.",
          path: ["respostaCorreta"],
        });
      }
      return;
    }

    if (questao.tipo === "VERDADEIRO_FALSO") {
      const resposta = String(questao.respostaCorreta)
        .trim()
        .toLocaleLowerCase("pt-BR");
      if (!["true", "false", "verdadeiro", "falso"].includes(resposta)) {
        ctx.addIssue({
          code: "custom",
          message: "A resposta correta deve ser Verdadeiro ou Falso.",
          path: ["respostaCorreta"],
        });
      }
      return;
    }

    if (
      typeof questao.respostaCorreta !== "string" ||
      !questao.respostaCorreta.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o texto correto para preencher a lacuna.",
        path: ["respostaCorreta"],
      });
    }
  });

const prazoSchema = z.union([z.string().max(40), z.null()]);

export const criarAtividadeSchema = z.object({
  titulo: texto("titulo", 150),
  materia: texto("materia", 80),
  prazo: prazoSchema.optional(),
  questoes: z
    .array(questaoSchema, { error: "Informe pelo menos uma questão." })
    .min(1, "Informe pelo menos uma questão.")
    .max(50, "Uma atividade pode ter no máximo 50 questões."),
});

export const editarAtividadeSchema = z
  .object({
    titulo: texto("titulo", 150).optional(),
    materia: texto("materia", 80).optional(),
    prazo: prazoSchema.optional(),
  })
  .refine((atividade) => Object.keys(atividade).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });