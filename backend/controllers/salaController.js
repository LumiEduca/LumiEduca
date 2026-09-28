import crypto from "node:crypto";
import { salaRepository } from "../repositories/salaRepository.js";
import { ApiError } from "../middlewares/errorHandler.js";

// Código de 6 caracteres, sem letras/números ambíguos (0, O, 1, I)
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const gerarCodigo = (tamanho = 6) =>
  Array.from(crypto.randomBytes(tamanho), (b) => ALFABETO[b % ALFABETO.length]).join("");

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

    await salaRepository.remover(sala.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};