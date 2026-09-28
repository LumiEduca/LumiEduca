import crypto from "node:crypto";
import { salaRepository } from "../repositories/salaRepository.js";

// Código de 6 caracteres, sem letras/números ambíguos (0, O, 1, I)
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const gerarCodigo = (tamanho = 6) =>
  Array.from(crypto.randomBytes(tamanho), (b) => ALFABETO[b % ALFABETO.length]).join("");

// Remove campos que o aluno não deve ver
const versaoAluno = ({ codigoAcesso, alunos, ...publico }) => publico;

// POST /salas — professor cria uma sala
export const criarSala = async (req, res) => {
  try {
    const { nome, descricao } = req.body ?? {};
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ erro: "O nome da sala é obrigatório" });
    }

    let codigoAcesso;
    for (let i = 0; i < 5; i++) {
      const candidato = gerarCodigo();
      if (!(await salaRepository.buscarPorCodigo(candidato))) {
        codigoAcesso = candidato;
        break;
      }
    }
    if (!codigoAcesso) {
      return res.status(500).json({ erro: "Não foi possível gerar um código de acesso único" });
    }

    const sala = await salaRepository.criar({
      nome: String(nome).trim(),
      descricao: descricao ? String(descricao).trim() : "",
      codigoAcesso,
      professorId: req.usuario.id,
    });
    res.status(201).json(sala);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar sala" });
  }
};

// GET /salas — lista as salas do professor logado
export const listarSalas = async (req, res) => {
  try {
    const salas = await salaRepository.listarPorProfessor(req.usuario.id);
    res.json(salas.map(({ alunos, ...resto }) => ({ ...resto, totalAlunos: alunos.length })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar salas" });
  }
};

// GET /salas/:id — professor dono ou aluno matriculado
export const detalharSala = async (req, res) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) return res.status(404).json({ erro: "Sala não encontrada" });

    const { id, papel } = req.usuario;
    const ehDono = papel === "professor" && sala.professorId === id;
    const ehAluno = papel === "aluno" && sala.alunos.includes(id);
    if (!ehDono && !ehAluno) {
      return res.status(403).json({ erro: "Você não tem acesso a esta sala" });
    }

    res.json(papel === "aluno" ? versaoAluno(sala) : sala);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar sala" });
  }
};

// POST /salas/entrar — aluno entra com o código de acesso
export const entrarNaSala = async (req, res) => {
  try {
    const codigo = String(req.body?.codigo ?? "").trim().toUpperCase();
    if (!codigo) return res.status(400).json({ erro: "Informe o código de acesso" });

    const sala = await salaRepository.buscarPorCodigo(codigo);
    if (!sala) return res.status(404).json({ erro: "Código de acesso inválido" });

    const atualizada = await salaRepository.adicionarAluno(sala.id, req.usuario.id);
    res.json({ mensagem: "Você entrou na sala", sala: versaoAluno(atualizada) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao entrar na sala" });
  }
};

// DELETE /salas/:id — professor dono remove a sala
export const removerSala = async (req, res) => {
  try {
    const sala = await salaRepository.buscarPorId(req.params.id);
    if (!sala) return res.status(404).json({ erro: "Sala não encontrada" });
    if (sala.professorId !== req.usuario.id) {
      return res.status(403).json({ erro: "Apenas o professor dono pode remover a sala" });
    }

    await salaRepository.remover(sala.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao remover sala" });
  }
};