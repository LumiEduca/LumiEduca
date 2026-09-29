import prisma from "../lib/prisma.js";
import { TIPOS } from "../lib/constants.js";

function validarQuestoes(questoes) {
  if (!Array.isArray(questoes) || questoes.length === 0) {
    return "A atividade precisa ter pelo menos uma questão.";
  }

  for (const questao of questoes) {
    if (!questao.enunciado || !String(questao.enunciado).trim()) {
      return "Toda questão precisa de um enunciado.";
    }

    if (!Array.isArray(questao.opcoes) || questao.opcoes.length < 2) {
      return "Toda questão precisa de pelo menos duas alternativas.";
    }

    const respostaCorreta = Number(questao.respostaCorreta);

    if (
      !Number.isInteger(respostaCorreta) ||
      respostaCorreta < 0 ||
      respostaCorreta >= questao.opcoes.length
    ) {
      return "A resposta correta precisa apontar para uma alternativa válida.";
    }
  }

  return null;
}

function serializarQuestao(questao) {
  return {
    id: questao.id,
    ordem: questao.ordem,
    enunciado: questao.enunciado,
    opcoes: JSON.parse(questao.opcoes),
    respostaCorreta: questao.respostaCorreta,
  };
}

export async function criarAtividade(req, res) {
  const { nome, questoes } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: "Informe um nome para a atividade." });
  }

  const erroValidacao = validarQuestoes(questoes);

  if (erroValidacao) {
    return res.status(400).json({ erro: erroValidacao });
  }

  const atividade = await prisma.atividade.create({
    data: {
      nome: nome.trim(),
      professorId: req.usuario.id,
      questoes: {
        create: questoes.map((questao, indice) => ({
          ordem: indice,
          enunciado: String(questao.enunciado).trim(),
          opcoes: JSON.stringify(questao.opcoes),
          respostaCorreta: Number(questao.respostaCorreta),
        })),
      },
    },
    include: { questoes: true },
  });

  return res.status(201).json({
    atividade: {
      id: atividade.id,
      nome: atividade.nome,
      criadoEm: atividade.criadoEm,
      totalQuestoes: atividade.questoes.length,
    },
  });
}

export async function listarAtividades(req, res) {
  const atividades = await prisma.atividade.findMany({
    where: { professorId: req.usuario.id },
    include: {
      questoes: { select: { id: true } },
      salaAtividades: { include: { sala: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return res.json({
    atividades: atividades.map((atividade) => ({
      id: atividade.id,
      nome: atividade.nome,
      criadoEm: atividade.criadoEm,
      totalQuestoes: atividade.questoes.length,
      salas: atividade.salaAtividades.map((v) => ({
        id: v.sala.id,
        nome: v.sala.nome,
      })),
    })),
  });
}

export async function obterAtividade(req, res) {
  const atividadeId = Number(req.params.id);

  if (!Number.isInteger(atividadeId)) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }

  const atividade = await prisma.atividade.findUnique({
    where: { id: atividadeId },
    include: {
      professor: true,
      questoes: { orderBy: { ordem: "asc" } },
    },
  });

  if (!atividade) {
    return res.status(404).json({ erro: "Atividade não encontrada." });
  }

  const podeAcessar =
    req.usuario.tipo === TIPOS.PROFESSOR
      ? atividade.professorId === req.usuario.id
      : await prisma.salaAtividade.findFirst({
          where: {
            atividadeId,
            sala: { matriculas: { some: { alunoId: req.usuario.id } } },
          },
        });

  if (!podeAcessar) {
    return res.status(404).json({ erro: "Atividade não encontrada." });
  }

  return res.json({
    atividade: {
      id: atividade.id,
      nome: atividade.nome,
      criadoPor: atividade.professor.nome,
      questoes: atividade.questoes.map(serializarQuestao),
    },
  });
}
