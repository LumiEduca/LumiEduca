import prisma from "../lib/prisma.js";
import { TIPOS } from "../lib/constants.js";

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function serializarSala(sala) {
  return { id: sala.id, nome: sala.nome, codigo: sala.codigo };
}

function serializarAtividadeResumo(atividade) {
  return {
    id: atividade.id,
    nome: atividade.nome,
    criadoPor: atividade.professor?.nome,
    totalQuestoes: atividade.questoes?.length ?? atividade._count?.questoes ?? 0,
  };
}

export async function criarSala(req, res) {
  const { nome } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: "Informe um nome para a sala." });
  }

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    try {
      const sala = await prisma.sala.create({
        data: {
          nome: nome.trim(),
          codigo: gerarCodigo(),
          professorId: req.usuario.id,
        },
      });

      return res.status(201).json({ sala: serializarSala(sala) });
    } catch (erro) {
      if (erro.code !== "P2002") {
        throw erro;
      }
    }
  }

  return res.status(500).json({ erro: "Não foi possível gerar um código único para a sala." });
}

export async function listarSalas(req, res) {
  if (req.usuario.tipo === TIPOS.PROFESSOR) {
    const salas = await prisma.sala.findMany({
      where: { professorId: req.usuario.id },
      orderBy: { criadoEm: "desc" },
    });

    return res.json({ salas: salas.map(serializarSala) });
  }

  const matriculas = await prisma.matricula.findMany({
    where: { alunoId: req.usuario.id },
    include: { sala: true },
    orderBy: { criadoEm: "desc" },
  });

  return res.json({ salas: matriculas.map((m) => serializarSala(m.sala)) });
}

export async function entrarNaSala(req, res) {
  const { codigo } = req.body;

  if (!codigo || !String(codigo).trim()) {
    return res.status(400).json({ erro: "Informe o código da sala." });
  }

  const sala = await prisma.sala.findUnique({
    where: { codigo: String(codigo).trim() },
  });

  if (!sala) {
    return res.status(404).json({ erro: "Código inválido." });
  }

  try {
    await prisma.matricula.create({
      data: { alunoId: req.usuario.id, salaId: sala.id },
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({ erro: "Você já está nesta sala." });
    }
    throw erro;
  }

  return res.status(201).json({ sala: serializarSala(sala) });
}

async function carregarSalaDoProfessor(salaId, professorId) {
  const sala = await prisma.sala.findUnique({ where: { id: salaId } });

  if (!sala || sala.professorId !== professorId) {
    return null;
  }

  return sala;
}

export async function vincularAtividade(req, res) {
  const salaId = Number(req.params.id);
  const { atividadeId } = req.body;

  if (!Number.isInteger(salaId) || !Number.isInteger(Number(atividadeId))) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }

  const sala = await carregarSalaDoProfessor(salaId, req.usuario.id);

  if (!sala) {
    return res.status(403).json({ erro: "Você não tem acesso a esta sala." });
  }

  const atividade = await prisma.atividade.findUnique({
    where: { id: Number(atividadeId) },
  });

  if (!atividade || atividade.professorId !== req.usuario.id) {
    return res
      .status(403)
      .json({ erro: "Você só pode vincular atividades criadas por você." });
  }

  try {
    await prisma.salaAtividade.create({
      data: { salaId, atividadeId: Number(atividadeId) },
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({ erro: "Atividade já vinculada a esta sala." });
    }
    throw erro;
  }

  return res.status(201).json({ sucesso: true });
}

export async function desvincularAtividade(req, res) {
  const salaId = Number(req.params.id);
  const atividadeId = Number(req.params.atividadeId);

  if (!Number.isInteger(salaId) || !Number.isInteger(atividadeId)) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }

  const sala = await carregarSalaDoProfessor(salaId, req.usuario.id);

  if (!sala) {
    return res.status(403).json({ erro: "Você não tem acesso a esta sala." });
  }

  const vinculo = await prisma.salaAtividade.findUnique({
    where: { salaId_atividadeId: { salaId, atividadeId } },
  });

  if (!vinculo) {
    return res.status(404).json({ erro: "Atividade não vinculada a esta sala." });
  }

  await prisma.salaAtividade.delete({ where: { id: vinculo.id } });

  return res.json({ sucesso: true });
}

export async function listarAtividadesDaSala(req, res) {
  const salaId = Number(req.params.id);

  if (!Number.isInteger(salaId)) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }

  const sala = await prisma.sala.findUnique({ where: { id: salaId } });

  if (!sala) {
    return res.status(403).json({ erro: "Você não tem acesso a esta sala." });
  }

  if (req.usuario.tipo === TIPOS.PROFESSOR) {
    if (sala.professorId !== req.usuario.id) {
      return res.status(403).json({ erro: "Você não tem acesso a esta sala." });
    }
  } else {
    const matricula = await prisma.matricula.findUnique({
      where: { alunoId_salaId: { alunoId: req.usuario.id, salaId } },
    });

    if (!matricula) {
      return res.status(403).json({ erro: "Você não tem acesso a esta sala." });
    }
  }

  const vinculos = await prisma.salaAtividade.findMany({
    where: { salaId },
    include: {
      atividade: {
        include: { professor: true, questoes: { select: { id: true } } },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return res.json({
    sala: serializarSala(sala),
    atividades: vinculos.map((v) => serializarAtividadeResumo(v.atividade)),
  });
}
