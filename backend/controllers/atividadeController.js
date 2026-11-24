import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

function validarTexto(valor, campo) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ApiError(400, `O campo '${campo}' é obrigatório e deve ser um texto.`);
  }

  return valor.trim();
}

function validarQuestoes(questoes) {
  if (!Array.isArray(questoes) || questoes.length === 0) {
    throw new ApiError(400, "Informe pelo menos uma questão.");
  }

  return questoes.map((questao, index) => {
    if (!questao || typeof questao !== "object" || Array.isArray(questao)) {
      throw new ApiError(400, `A questão ${index + 1} é inválida.`);
    }

    const enunciado = validarTexto(questao.enunciado, `questoes[${index}].enunciado`);

    const tipo = questao.tipo ?? "MULTIPLA_ESCOLHA";
    let opcoes;
    let respostaCorreta;

    if (tipo === "MULTIPLA_ESCOLHA") {
      if (!Array.isArray(questao.opcoes) || questao.opcoes.length < 2) {
        throw new ApiError(400, `A questão ${index + 1} deve ter pelo menos duas opções.`);
      }

      opcoes = questao.opcoes.map((opcao, opcaoIndex) =>
        validarTexto(opcao, `questoes[${index}].opcoes[${opcaoIndex}]`)
      );
      const respostaInformada = questao.respostaCorreta;
      const respostaIndex =
        typeof respostaInformada === "number" ||
        (typeof respostaInformada === "string" && respostaInformada.trim() !== "")
          ? Number(respostaInformada)
          : Number.NaN;

      if (
        !Number.isInteger(respostaIndex) ||
        respostaIndex < 0 ||
        respostaIndex >= opcoes.length
      ) {
        throw new ApiError(400, `A resposta correta da questão ${index + 1} deve indicar uma opção existente.`);
      }
      respostaCorreta = String(respostaIndex);
    } else if (tipo === "VERDADEIRO_FALSO") {
      opcoes = ["Verdadeiro", "Falso"];
      const resposta = String(questao.respostaCorreta)
        .trim()
        .toLocaleLowerCase("pt-BR");
      respostaCorreta = ["true", "verdadeiro"].includes(resposta)
        ? "Verdadeiro"
        : "Falso";
    } else {
      opcoes = [];
      respostaCorreta = validarTexto(
        questao.respostaCorreta,
        `questoes[${index}].respostaCorreta`
      );
    }

    return {
      enunciado,
      opcoes,
      respostaCorreta,
      tipo,
      ordem: index,
    };
  });
}

export const criarAtividade = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const titulo = validarTexto(body.titulo, "titulo");
    const materia = validarTexto(body.materia, "materia");
    const questoes = validarQuestoes(body.questoes);

    let prazo;
    if (body.prazo !== undefined && body.prazo !== null && body.prazo !== "") {
      prazo = new Date(body.prazo);
      if (Number.isNaN(prazo.getTime())) {
        throw new ApiError(400, "O campo 'prazo' deve ser uma data válida.");
      }
    }

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        materia,
        prazo,
        professorId: req.usuario.id,
        questoes: { create: questoes },
      },
      include: { questoes: { orderBy: { ordem: "asc" } } },
    });

    res.status(201).json(atividade);
  } catch (error) {
    next(error);
  }
};

export const listarAtividades = async (req, res, next) => {
  try {
    const atividades = await prisma.atividade.findMany({
      where: { professorId: req.usuario.id },
      orderBy: { criadaEm: "desc" },
      include: { _count: { select: { questoes: true } } },
    });

    res.json(atividades);
  } catch (error) {
    next(error);
  }
};

export const obterAtividade = async (req, res, next) => {
  try {
    const atividade = await prisma.atividade.findUnique({
      where: { id: req.params.id },
      include: { questoes: { orderBy: { ordem: "asc" } } },
    });

    if (!atividade) throw new ApiError(404, "Atividade não encontrada.");

    const { id, tipo } = req.usuario;
    if (tipo === "PROFESSOR") {
      if (atividade.professorId !== id) {
        throw new ApiError(403, "Você não tem acesso a esta atividade.");
      }
      return res.json(atividade);
    }

    if (tipo !== "ALUNO") {
      throw new ApiError(403, "Você não tem acesso a esta atividade.");
    }

    const matricula = await prisma.salaAtividade.findFirst({
      where: {
        atividadeId: atividade.id,
        sala: { matriculas: { some: { alunoId: id } } },
      },
      select: { id: true },
    });

    if (!matricula) throw new ApiError(403, "Você não tem acesso a esta atividade.");

    res.json({
      ...atividade,
      questoes: atividade.questoes.map(({ respostaCorreta, ...questao }) => questao),
    });
  } catch (error) {
    next(error);
  }
};

export const editarAtividade = async (req, res, next) => {
  try {
    const atividade = await prisma.atividade.findUnique({
      where: { id: req.params.id },
      select: { id: true, professorId: true },
    });

    if (!atividade) throw new ApiError(404, "Atividade não encontrada.");
    if (atividade.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode editar esta atividade.");
    }

    const data = {};
    if (req.body.titulo !== undefined) data.titulo = req.body.titulo;
    if (req.body.materia !== undefined) data.materia = req.body.materia;
    if (req.body.prazo !== undefined) {
      if (req.body.prazo === null || req.body.prazo === "") {
        data.prazo = null;
      } else {
        const prazo = new Date(req.body.prazo);
        if (Number.isNaN(prazo.getTime())) {
          throw new ApiError(400, "O campo 'prazo' deve ser uma data válida.");
        }
        data.prazo = prazo;
      }
    }

    const atualizada = await prisma.atividade.update({
      where: { id: atividade.id },
      data,
      include: { questoes: { orderBy: { ordem: "asc" } } },
    });
    res.json(atualizada);
  } catch (error) {
    next(error);
  }
};

export const excluirAtividade = async (req, res, next) => {
  try {
    const atividade = await prisma.atividade.findUnique({
      where: { id: req.params.id },
      select: { id: true, professorId: true },
    });

    if (!atividade) throw new ApiError(404, "Atividade não encontrada.");
    if (atividade.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode excluir esta atividade.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.resposta.deleteMany({
        where: { questao: { atividadeId: atividade.id } },
      });
      await tx.questao.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.salaAtividade.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.progresso.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.atividade.delete({ where: { id: atividade.id } });
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};