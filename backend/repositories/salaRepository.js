import crypto from "node:crypto";

// Armazenamento EM MEMÓRIA: os dados somem quando o servidor reinicia.
// Quando o Firebase real estiver configurado, troque só este arquivo por
// uma versão que usa Firestore, mantendo os mesmos métodos.
const salas = new Map();

export const salaRepository = {
  async criar(dados) {
    const sala = {
      id: crypto.randomUUID(),
      ...dados,
      alunos: [],
      criadoEm: new Date().toISOString(),
    };
    salas.set(sala.id, sala);
    return sala;
  },

  async buscarPorId(id) {
    return salas.get(id) ?? null;
  },

  async buscarPorCodigo(codigo) {
    for (const sala of salas.values()) {
      if (sala.codigoAcesso === codigo) return sala;
    }
    return null;
  },

  async listarPorProfessor(professorId) {
    return [...salas.values()]
      .filter((s) => s.professorId === professorId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },

  async adicionarAluno(id, alunoId) {
    const sala = salas.get(id);
    if (sala && !sala.alunos.includes(alunoId)) sala.alunos.push(alunoId);
    return sala ?? null;
  },

  async remover(id) {
    return salas.delete(id);
  },
};