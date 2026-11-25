import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

const PONTOS_POR_ACERTO = 10;
const TIPOS = ["MULTIPLA_ESCOLHA", "VERDADEIRO_FALSO", "LACUNA"];

const normalizar = (texto) => String(texto ?? "").trim().toLocaleLowerCase("pt-BR");

const paraIndice = (valor) =>
  typeof valor === "number" || (typeof valor === "string" && valor.trim() !== "")
    ? Number(valor)
    : Number.NaN;

// Aceita respostaCorreta de múltipla escolha como índice em texto ("1") ou como texto da opção (seed)
const indiceCorreto = (questao) => {
  const opcoes = questao.opcoes ?? [];
  const porTexto = opcoes.indexOf(questao.respostaCorreta);
  if (porTexto !== -1) return porTexto;
  const n = paraIndice(questao.respostaCorreta);
  return Number.isInteger(n) && n >= 0 && n < opcoes.length ? n : -1;
};

// Gabarito no formato que o front usa: índice (múltipla escolha) ou texto (V/F e lacuna)
const gabarito = (questao) => {
  const tipo = questao.tipo ?? "MULTIPLA_ESCOLHA";
  return tipo === "MULTIPLA_ESCOLHA" ? indiceCorreto(questao) : questao.respostaCorreta;
};

// Monta a questão no mesmo formato que o atividadeController grava
const montarQuestao = (body) => {
  const tipo = body.tipo ?? "MULTIPLA_ESCOLHA";
  if (!TIPOS.includes(tipo)) throw new ApiError(400, "Tipo de questão inválido");

  const enunciado = String(body.pergunta ?? "").trim();
  if (!enunciado) throw new ApiError(400, "A pergunta é obrigatória");

  if (tipo === "MULTIPLA_ESCOLHA") {
    const opcoes = Array.isArray(body.opcoes)
      ? body.opcoes.map((o) => String(o ?? "").trim())
      : [];
    if (opcoes.length < 2 || opcoes.some((o) => !o)) {
      throw new ApiError(400, "Preencha todas as alternativas");
    }
    const indice = paraIndice(body.respostaCorreta);
    if (!Number.isInteger(indice) || indice < 0 || indice >= opcoes.length) {
      throw new ApiError(400, "Alternativa correta inválida");
    }
    return { enunciado, tipo, opcoes, respostaCorreta: String(indice) };
  }

  if (tipo === "VERDADEIRO_FALSO") {
    const r = normalizar(body.respostaCorreta);
    if (!["verdadeiro", "falso", "true", "false"].includes(r)) {
      throw new ApiError(400, "A resposta correta deve ser Verdadeiro ou Falso");
    }
    return {
      enunciado,
      tipo,
      opcoes: ["Verdadeiro", "Falso"],
      respostaCorreta: ["verdadeiro", "true"].includes(r) ? "Verdadeiro" : "Falso",
    };
  }

  const resposta = String(body.respostaCorreta ?? "").trim();
  if (!resposta) throw new ApiError(400, "Informe o texto que completa a lacuna");
  return { enunciado, tipo, opcoes: [], respostaCorreta: resposta };
};

const lerDados = (body) => {
  const titulo = String(body.nomeAtividade ?? "").trim();
  if (!titulo) throw new ApiError(400, "O nome da atividade é obrigatório");

  let prazo = null;
  if (body.prazo) {
    prazo = new Date(body.prazo);
    if (Number.isNaN(prazo.getTime())) {
      throw new ApiError(400, "O prazo deve ser uma data válida");
    }
  }

  return {
    titulo,
    materia: String(body.materia ?? "").trim(),
    prazo,
    questao: montarQuestao(body),
  };
};

const salaDoProfessor = async (salaId, professorId) => {
  const sala = await prisma.sala.findUnique({ where: { id: String(salaId ?? "") } });
  if (!sala) throw new ApiError(404, "Sala não encontrada");
  if (sala.professorId !== professorId) {
    throw new ApiError(403, "Apenas o professor dono da sala mexe nos desafios dela");
  }
  return sala;
};

// Confere a resposta do aluno e devolve o texto que será gravado
const conferir = (questao, resposta) => {
  const tipo = questao.tipo ?? "MULTIPLA_ESCOLHA";

  if (tipo === "MULTIPLA_ESCOLHA") {
    const indice = paraIndice(resposta);
    if (!Number.isInteger(indice) || indice < 0 || indice >= questao.opcoes.length) {
      throw new ApiError(400, "Alternativa inválida");
    }
    return { correta: indice === indiceCorreto(questao), texto: questao.opcoes[indice] };
  }

  if (tipo === "VERDADEIRO_FALSO") {
    const r = normalizar(resposta);
    if (!["verdadeiro", "falso"].includes(r)) throw new ApiError(400, "Resposta inválida");
    const texto = r === "verdadeiro" ? "Verdadeiro" : "Falso";
    return { correta: normalizar(texto) === normalizar(questao.respostaCorreta), texto };
  }

  const texto = String(resposta ?? "").trim();
  if (!texto) throw new ApiError(400, "Informe a resposta");
  return { correta: normalizar(texto) === normalizar(questao.respostaCorreta), texto };
};

// POST /api/v1/desafios: professor cria um desafio numa sala dele
export const criarDesafio = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const dados = lerDados(body);
    const sala = await salaDoProfessor(body.salaId, req.usuario.id);

    const atividade = await prisma.$transaction(async (tx) => {
      const criada = await tx.atividade.create({
        data: {
          titulo: dados.titulo,
          materia: dados.materia || sala.nome,
          prazo: dados.prazo,
          professorId: req.usuario.id,
          questoes: { create: [{ ...dados.questao, ordem: 0 }] },
        },
      });
      await tx.salaAtividade.create({
        data: { salaId: sala.id, atividadeId: criada.id },
      });
      return criada;
    });

    res.status(201).json({ id: atividade.id });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/desafios/:id: professor dono edita o desafio
export const editarDesafio = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const atividade = await prisma.atividade.findUnique({
      where: { id: req.params.id },
      include: { questoes: { orderBy: { ordem: "asc" }, take: 1 } },
    });
    if (!atividade) throw new ApiError(404, "Desafio não encontrado");
    if (atividade.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode editar o desafio");
    }

    const dados = lerDados(body);
    const sala = body.salaId ? await salaDoProfessor(body.salaId, req.usuario.id) : null;

    await prisma.$transaction(async (tx) => {
      await tx.atividade.update({
        where: { id: atividade.id },
        data: {
          titulo: dados.titulo,
          materia: dados.materia || sala?.nome || atividade.materia,
          prazo: dados.prazo,
        },
      });

      const questaoAtual = atividade.questoes[0];
      if (questaoAtual) {
        await tx.questao.update({ where: { id: questaoAtual.id }, data: dados.questao });
      } else {
        await tx.questao.create({
          data: { ...dados.questao, atividadeId: atividade.id, ordem: 0 },
        });
      }

      if (sala) {
        const vinculos = await tx.salaAtividade.findMany({
          where: { atividadeId: atividade.id },
        });
        if (!vinculos.some((v) => v.salaId === sala.id)) {
          await tx.salaAtividade.deleteMany({ where: { atividadeId: atividade.id } });
          await tx.salaAtividade.create({
            data: { salaId: sala.id, atividadeId: atividade.id },
          });
        }
      }
    });

    res.json({ id: atividade.id });
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
      ? { professorId: usuarioId }
      : { matriculas: { some: { alunoId: usuarioId } } };
    if (salaId) filtroSala.id = salaId;

    const vinculos = await prisma.salaAtividade.findMany({
      where: { sala: filtroSala },
      include: { sala: { select: { id: true, nome: true, codigo: true } } },
    });

    const atividades = await prisma.atividade.findMany({
      where: { id: { in: vinculos.map((v) => v.atividadeId) } },
      orderBy: { criadaEm: "desc" },
      include: { questoes: { orderBy: { ordem: "asc" }, take: 1 } },
    });
    const porId = new Map(atividades.map((a) => [a.id, a]));

    const questaoIds = atividades.flatMap((a) => a.questoes.map((q) => q.id));
    const respostas = ehProfessor
      ? []
      : await prisma.resposta.findMany({
          where: { alunoId: usuarioId, questaoId: { in: questaoIds } },
        });
    const respondidas = new Set(respostas.map((r) => r.questaoId));

    const resultado = vinculos
      .filter((v) => porId.get(v.atividadeId)?.questoes.length > 0)
      .sort((a, b) => porId.get(b.atividadeId).criadaEm - porId.get(a.atividadeId).criadaEm)
      .map((v) => {
        const atividade = porId.get(v.atividadeId);
        const questao = atividade.questoes[0];
        const concluida = respondidas.has(questao.id);
        const atrasada =
          !ehProfessor &&
          atividade.prazo !== null &&
          atividade.prazo < new Date() &&
          !concluida;
        const item = {
          id: atividade.id,
          nomeAtividade: atividade.titulo,
          materia: atividade.materia,
          prazo: atividade.prazo ? atividade.prazo.toISOString() : null,
          tipo: questao.tipo ?? "MULTIPLA_ESCOLHA",
          pergunta: questao.enunciado,
          opcoes: questao.opcoes,
          salaId: v.sala.id,
          salaNome: v.sala.nome,
          salaCodigo: v.sala.codigo,
          concluida,
          atrasada,
        };
        // O gabarito só vai para o professor ou para o aluno que já respondeu
        if (ehProfessor || concluida) item.respostaCorreta = gabarito(questao);
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
      include: { questoes: { orderBy: { ordem: "asc" }, take: 1 } },
    });
    if (!atividade || atividade.questoes.length === 0) {
      throw new ApiError(404, "Desafio não encontrado");
    }

    const vinculos = await prisma.salaAtividade.findMany({
      where: { atividadeId: atividade.id },
      select: { salaId: true },
    });
    const matriculado = await prisma.matricula.findFirst({
      where: { alunoId, salaId: { in: vinculos.map((v) => v.salaId) } },
    });
    if (!matriculado) throw new ApiError(403, "Você não está na sala deste desafio");

    const questao = atividade.questoes[0];

    const anterior = await prisma.resposta.findFirst({
      where: { alunoId, questaoId: questao.id },
    });
    if (anterior) {
      return res.json({
        jaRespondida: true,
        correta: anterior.correta,
        respostaCorreta: gabarito(questao),
        pontosGanhos: 0,
      });
    }

    const { correta, texto } = conferir(questao, req.body?.resposta);
    const pontos = correta ? PONTOS_POR_ACERTO : 0;

    await prisma.$transaction(async (tx) => {
      await tx.resposta.create({
        data: { alunoId, questaoId: questao.id, resposta: texto, correta },
      });

      const progresso = await tx.progresso.findFirst({
        where: { alunoId, atividadeId: atividade.id },
      });
      if (progresso) {
        await tx.progresso.update({
          where: { id: progresso.id },
          data: { pontos, concluida: true },
        });
      } else {
        await tx.progresso.create({
          data: {
            alunoId,
            atividadeId: atividade.id,
            materia: atividade.materia,
            pontos,
            concluida: true,
          },
        });
      }
    });

    res.status(201).json({
      jaRespondida: false,
      correta,
      respostaCorreta: gabarito(questao),
      pontosGanhos: pontos,
    });
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

    await prisma.$transaction(async (tx) => {
      await tx.resposta.deleteMany({ where: { questao: { atividadeId: atividade.id } } });
      await tx.progresso.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.salaAtividade.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.questao.deleteMany({ where: { atividadeId: atividade.id } });
      await tx.atividade.delete({ where: { id: atividade.id } });
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
