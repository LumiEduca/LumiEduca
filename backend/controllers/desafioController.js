import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

const PONTOS_POR_ACERTO = 10;

// Aceita respostaCorreta como texto da opção (seed) ou como índice em texto (atividadeController)
const indiceCorreto = (questao) => {
  const opcoes = questao.opcoes;
  const porTexto = opcoes.indexOf(questao.respostaCorreta);
  if (porTexto !== -1) return porTexto;
  const n = Number(questao.respostaCorreta);
  return Number.isInteger(n) && n >= 0 && n < opcoes.length ? n : -1;
};

// POST /api/v1/desafios: professor cria um desafio numa sala dele
export const criarDesafio = async (req, res, next) => {
  try {
    const { salaId, nomeAtividade, pergunta, opcoes, indiceCorreto: idxBody } = req.body ?? {};
    const titulo = String(nomeAtividade ?? "").trim();
    const enunciado = String(pergunta ?? "").trim();

    if (!titulo || !enunciado) {
      throw new ApiError(400, "Nome da atividade e pergunta são obrigatórios");
    }
    if (!Array.isArray(opcoes) || opcoes.length < 2 || opcoes.some((o) => !String(o).trim())) {
      throw new ApiError(400, "Preencha todas as alternativas");
    }

    const lista = opcoes.map((o) => String(o).trim());
    const indice = Number(idxBody);
    if (!Number.isInteger(indice) || indice < 0 || indice >= lista.length) {
      throw new ApiError(400, "Alternativa correta inválida");
    }

    const sala = await prisma.sala.findUnique({ where: { id: String(salaId ?? "") } });
    if (!sala) throw new ApiError(404, "Sala não encontrada");
    if (sala.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono da sala cria desafios nela");
    }

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        materia: sala.nome,
        professorId: req.usuario.id,
        questoes: {
          create: [{ enunciado, opcoes: lista, respostaCorreta: String(indice), ordem: 0 }],
        },
        salaAtividades: { create: [{ salaId: sala.id }] },
      },
    });

    res.status(201).json({ id: atividade.id });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/desafios?salaId=...: professor vê os das salas dele, aluno os das salas em que está
export const listarDesafios = async (req, res, next) => {
  try {
    const { id: usuarioId, tipo } = req.usuario;
    const salaId = req.query.salaId ? String(req.query.salaId) : null;
    const ehProfessor = tipo === "PROFESSOR";

    const filtroSala = ehProfessor
      ? { professorId: usuarioId, ...(salaId && { id: salaId }) }
      : { matriculas: { some: { alunoId: usuarioId } }, ...(salaId && { id: salaId }) };

    const vinculos = await prisma.salaAtividade.findMany({
      where: { sala: filtroSala },
      orderBy: { criadaEm: "desc" },
      include: {
        sala: { select: { id: true, nome: true, codigo: true } },
        atividade: {
          include: { questoes: { orderBy: { ordem: "asc" }, take: 1 } },
        },
      },
    });

    const questaoIds = vinculos.flatMap((v) => v.atividade.questoes.map((q) => q.id));
    const respostas = ehProfessor
      ? []
      : await prisma.resposta.findMany({
          where: { alunoId: usuarioId, questaoId: { in: questaoIds } },
        });
    const respondidas = new Set(respostas.map((r) => r.questaoId));

    const resultado = vinculos
      .filter((v) => v.atividade.questoes.length > 0)
      .map((v) => {
        const questao = v.atividade.questoes[0];
        const concluida = respondidas.has(questao.id);
        const item = {
          id: v.atividade.id,
          nomeAtividade: v.atividade.titulo,
          pergunta: questao.enunciado,
          opcoes: questao.opcoes,
          salaId: v.sala.id,
          salaNome: v.sala.nome,
          concluida,
        };
        // O gabarito só vai para o professor ou para o aluno que já respondeu
        if (ehProfessor || concluida) item.respostaCorreta = indiceCorreto(questao);
        if (ehProfessor) item.salaCodigo = v.sala.codigo;
        return item;
      });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/desafios/:id/responder: aluno responde (pontos só na 1ª vez)
export const responderDesafio = async (req, res, next) => {
  try {
    const alunoId = req.usuario.id;

    const atividade = await prisma.atividade.findUnique({
      where: { id: req.params.id },
      include: { questoes: { orderBy: { ordem: "asc" }, take: 1 }, salaAtividades: true },
    });
    if (!atividade || atividade.questoes.length === 0) {
      throw new ApiError(404, "Desafio não encontrado");
    }

    const matriculado = await prisma.matricula.findFirst({
      where: { alunoId, salaId: { in: atividade.salaAtividades.map((s) => s.salaId) } },
    });
    if (!matriculado) throw new ApiError(403, "Você não está na sala deste desafio");

    const questao = atividade.questoes[0];
    const correto = indiceCorreto(questao);

    const anterior = await prisma.resposta.findUnique({
      where: { alunoId_questaoId: { alunoId, questaoId: questao.id } },
    });
    if (anterior) {
      return res.json({
        jaRespondida: true,
        correta: anterior.correta,
        indiceCorreto: correto,
        pontosGanhos: 0,
      });
    }

    const indice = Number(req.body?.indice);
    if (!Number.isInteger(indice) || indice < 0 || indice >= questao.opcoes.length) {
      throw new ApiError(400, "Alternativa inválida");
    }

    const correta = indice === correto;
    const pontos = correta ? PONTOS_POR_ACERTO : 0;

    await prisma.$transaction([
      prisma.resposta.create({
        data: { alunoId, questaoId: questao.id, resposta: questao.opcoes[indice], correta },
      }),
      prisma.progresso.upsert({
        where: { alunoId_atividadeId: { alunoId, atividadeId: atividade.id } },
        update: { pontos, concluida: true },
        create: {
          alunoId,
          atividadeId: atividade.id,
          materia: atividade.materia,
          pontos,
          concluida: true,
        },
      }),
    ]);

    res.status(201).json({ jaRespondida: false, correta, indiceCorreto: correto, pontosGanhos: pontos });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/desafios/:id: professor dono exclui
export const removerDesafio = async (req, res, next) => {
  try {
    const atividade = await prisma.atividade.findUnique({ where: { id: req.params.id } });
    if (!atividade) throw new ApiError(404, "Desafio não encontrado");
    if (atividade.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode excluir o desafio");
    }

    await prisma.$transaction([
      prisma.resposta.deleteMany({ where: { questao: { atividadeId: atividade.id } } }),
      prisma.progresso.deleteMany({ where: { atividadeId: atividade.id } }),
      prisma.salaAtividade.deleteMany({ where: { atividadeId: atividade.id } }),
      prisma.questao.deleteMany({ where: { atividadeId: atividade.id } }),
      prisma.atividade.delete({ where: { id: atividade.id } }),
    ]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};