import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';

export default function TeacherReportPage() {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    setHistorico(JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]'));
  }, []);

  const resumo = useMemo(() => {
    const acertos = historico.filter((h) => h.status.includes('✅')).length;
    const erros = historico.filter((h) => h.status.includes('❌')).length;

    return {
      total: historico.length,
      acertos,
      erros,
    };
  }, [historico]);

  return (
    <div className="professor-page">
      <main className="professor-page-content">
        <button
          type="button"
          className="professor-back-button"
          onClick={() => navigate('/')}
        >
          ← Voltar ao início
        </button>

        <section className="professor-card blue-top">
          <span className="professor-badge">📊 Acompanhamento pedagógico</span>

          <h1 className="professor-title">Relatório de atividades</h1>

          <p className="professor-text">
            Visualize rapidamente o histórico de respostas enviadas pelos alunos.
          </p>

          <div className="professor-summary-grid">
            <div className="professor-summary-item">
              <span className="professor-summary-label">Registros totais</span>
              <strong className="professor-summary-value">{resumo.total}</strong>
            </div>

            <div className="professor-summary-item">
              <span className="professor-summary-label">Acertos</span>
              <strong className="professor-summary-value">{resumo.acertos}</strong>
            </div>

            <div className="professor-summary-item">
              <span className="professor-summary-label">Erros</span>
              <strong className="professor-summary-value">{resumo.erros}</strong>
            </div>
          </div>

          {historico.length === 0 ? (
            <div className="professor-empty">Nenhum registro encontrado.</div>
          ) : (
            <div className="professor-table-wrap">
              <table className="professor-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Sala</th>
                    <th>Atividade</th>
                    <th>Status</th>
                    <th>Data/Hora</th>
                  </tr>
                </thead>

                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id}>
                      <td>{h.aluno}</td>
                      <td>{h.salaNome || 'Geral'}</td>
                      <td>{h.nomeAtividade || h.pergunta}</td>
                      <td
                        className={
                          h.status.includes('✅')
                            ? 'professor-status-success'
                            : 'professor-status-error'
                        }
                      >
                        {h.status}
                      </td>
                      <td>
                        {h.data} - {h.hora}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="professor-action-row">
            <button
              type="button"
              className="professor-btn primary"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>

            <button
              type="button"
              className="professor-btn secondary"
              onClick={() => navigate('/tarefas-recebidas')}
            >
              Abrir gestão de tarefas
            </button>
          </div>
        </section>
      </main>

      <footer className="app-footer student-footer">
        <div className="app-footer-content student-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}