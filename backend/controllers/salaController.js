import crypto from "node:crypto";
import prisma from "../config/prismaClient.js";
import { salaRepository } from "../repositories/salaRepository.js";
import { ApiError } from "../middlewares/errorHandler.js";

// Código numérico de 6 dígitos
const gerarCodigo = () => String(crypto.randomInt(100000, 1000000));

// Remove o código de acesso e a lista de matrículas da resposta para o aluno
const versaoAluno = (sala) => {
  const { codigo, matriculas, ...publico } = sala;
  return publico;
};

// POST /api/v1/salas — professor cria uma sala
export const criarSala = async (req, res, next) => {
  try {
    const { nome } = req.body ?? {};
    if (!nome || !String(nome).trim()) {
      throw new ApiError(400, "O nome da sala é obrigatório");
    }

    let codigo;
    for (let i = 0; i < 5; i++) {
      const candidato = gerarCodigo();
      if (!(await salaRepository.buscarPorCodigo(candidato))) {
        codigo = candidato;
        break;
      }
    }
    if (!codigo) {
      throw new ApiError(500, "Não foi possível gerar um código de acesso único");
    }

    const sala = await salaRepository.criar({
      nome: String(nome).trim(),
      codigo,
      professorId: req.usuario.id,
    });
    res.status(201).json(sala);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/salas — lista as salas do professor logado
export const listarSalas = async (req, res, next) => {
  try {
    const salas = await salaRepository.listarPorProfessor(req.usuario.id);
    res.json(
      salas.map(({ matriculas, ...resto }) => ({
        ...resto,
        totalAlunos: matriculas.length,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/salas/:id — professor dono ou aluno matriculado
export const detalharSala = async (req, res, next) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");

    const { id, tipo } = req.usuario;
    const ehDono = tipo === "PROFESSOR" && sala.professorId === id;
    const ehAluno = tipo === "ALUNO" && sala.matriculas.some((m) => m.alunoId === id);

    if (!ehDono && !ehAluno) {
      throw new ApiError(403, "Você não tem acesso a esta sala");
    }

    res.json(tipo === "ALUNO" ? versaoAluno(sala) : sala);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/salas/entrar — aluno entra usando o código de acesso
export const entrarNaSala = async (req, res, next) => {
  try {
    const codigo = String(req.body?.codigo ?? "").trim().toUpperCase();
    if (!codigo) throw new ApiError(400, "Informe o código de acesso");

    const sala = await salaRepository.buscarPorCodigo(codigo);
    if (!sala) throw new ApiError(404, "Código de acesso inválido");

    await salaRepository.matricularAluno(sala.id, req.usuario.id);

    const { codigo: _codigo, ...publico } = sala;
    res.json({ mensagem: "Você entrou na sala", sala: publico });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/salas/:id — professor dono remove a sala
export const removerSala = async (req, res, next) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");
    if (sala.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode remover a sala");
    }

    // Matrículas e associações com atividades saem junto, tudo ou nada
    await prisma.$transaction([
      prisma.matricula.deleteMany({ where: { salaId: sala.id } }),
      prisma.salaAtividade.deleteMany({ where: { salaId: sala.id } }),
      prisma.sala.delete({ where: { id: sala.id } }),
    ]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/salas/:id — professor dono edita o nome
export const editarSala = async (req, res, next) => {
  try {
    const nome = String(req.body?.nome ?? "").trim();
    if (!nome) throw new ApiError(400, "O nome da sala é obrigatório");

    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");
    if (sala.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode editar a sala");
    }

    const atualizada = await salaRepository.atualizarNome(sala.id, nome);
    res.json(atualizada);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/salas/:id/alunos/:alunoId — professor dono remove um aluno
export const removerAluno = async (req, res, next) => {
  try {
    const { id, alunoId } = req.params;

    const sala = await salaRepository.buscarPorId(id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");
    if (sala.professorId !== req.usuario.id) {
      throw new ApiError(403, "Apenas o professor dono pode remover alunos da sala");
    }

    const { count } = await salaRepository.removerMatricula(id, alunoId);
    if (count === 0) throw new ApiError(404, "Aluno não encontrado nesta sala");

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/salas/:id/sair — aluno sai da sala
export const sairDaSala = async (req, res, next) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");

    const { count } = await salaRepository.removerMatricula(sala.id, req.usuario.id);
    if (count === 0) throw new ApiError(404, "Você não está nesta sala");

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/salas/:id/ranking — lista de alunos com pontos (dono ou aluno matriculado)
export const rankingDaSala = async (req, res, next) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) throw new ApiError(404, "Sala não encontrada");

    const { id, tipo } = req.usuario;
    const ehDono = tipo === "PROFESSOR" && sala.professorId === id;
    const ehAluno = tipo === "ALUNO" && sala.matriculas.some((m) => m.alunoId === id);
    if (!ehDono && !ehAluno) {
      throw new ApiError(403, "Você não tem acesso a esta sala");
    }

    const ranking = await salaRepository.rankingPorSala(sala.id);
    res.json({ sala: { id: sala.id, nome: sala.nome }, ranking });
  } catch (err) {
    next(err);
  }
};