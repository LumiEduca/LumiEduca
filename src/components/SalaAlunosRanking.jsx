import React, { useEffect, useState } from 'react';
import {
  buscarRankingDaSala,
  removerAlunoDaSala,
  sairDaSala,
} from '../services/salaService';

export default function SalaAlunosRanking({ sala, isProfessor, onSaiu }) {
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const data = await buscarRankingDaSala(sala.id);
      setRanking(data.ranking || []);
    } catch (e) {
      setRanking([]);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala.id]);

  const handleRemover = async (aluno) => {
    if (!window.confirm(`Remover ${aluno.nome} da sala?`)) return;
    try {
      await removerAlunoDaSala(sala.id, aluno.alunoId);
      setRanking((prev) => prev.filter((a) => a.alunoId !== aluno.alunoId));
    } catch (e) {
      setErro(e.message);
    }
  };

  const handleSair = async () => {
    if (!window.confirm(`Sair da sala "${sala.nome}"?`)) return;
    try {
      await sairDaSala(sala.id);
      onSaiu?.(sala);
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <section className="classrooms-ranking">
      <div className="classrooms-ranking-header">
        <h2>🏆 Alunos e ranking</h2>

        {!isProfessor && (
          <button type="button" className="classrooms-btn danger" onClick={handleSair}>
            Sair da sala
          </button>
        )}
      </div>

      {erro && <p className="classrooms-error">{erro}</p>}

      {carregando ? (
        <p className="classrooms-empty">Carregando...</p>
      ) : ranking.length === 0 && !erro ? (
        <p className="classrooms-empty">Nenhum aluno na sala ainda.</p>
      ) : (
        <ol className="classrooms-ranking-list">
          {ranking.map((aluno) => (
            <li key={aluno.alunoId} className="classrooms-ranking-item">
              <span className="classrooms-ranking-pos">{aluno.posicao}º</span>
              <span className="classrooms-ranking-name">{aluno.nome}</span>
              <span className="classrooms-ranking-points">{aluno.pontos} pts</span>

              {isProfessor && (
                <button
                  type="button"
                  className="classrooms-btn danger small"
                  onClick={() => handleRemover(aluno)}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}