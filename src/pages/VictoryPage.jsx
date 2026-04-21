import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/victory.css';

export default function VictoryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const ganhosTrilha = location.state?.ganhos || 0;
  const errouAlguma = location.state?.errouAlguma || false;
  const resumoQuestoes = location.state?.resumoQuestoes || [];

  return (
    <div className="victory-page page-wrapper">
      <main className="victory-content">
        <section className="victory-card">
          <div className="victory-icon">🎉</div>

          <h1 className="victory-title">
            {errouAlguma ? 'Boa tentativa!' : 'Incrível!'}
          </h1>

          <p className="victory-subtitle">
            {errouAlguma
              ? 'Você concluiu a fase, mas ainda pode melhorar algumas respostas.'
              : 'Você completou o desafio sem errar nada!'}
          </p>

          <div className="victory-points-card">
            <span className="victory-points-label">Você ganhou</span>
            <h2 className="victory-points-value">+{ganhosTrilha}</h2>
            <span className="victory-points-label">estrelas!</span>
          </div>

          {resumoQuestoes.length > 0 && (
            <div className="victory-summary">
              <h3 className="victory-summary-title">Resumo das questões</h3>

              <div className="victory-summary-list">
                {resumoQuestoes.map((item) => (
                  <div
                    key={item.id}
                    className={`summary-item ${item.acertou ? 'correct' : 'incorrect'}`}
                  >
                    <div className="summary-item-header">
                      <span className="summary-question-number">Questão {item.id}</span>
                      <span className="summary-status">
                        {item.acertou ? '✅ Correta' : '❌ Revise'}
                      </span>
                    </div>

                    <p className="summary-question">{item.pergunta}</p>

                    <p className="summary-answer">
                      <strong>Sua resposta:</strong>{' '}
                      {item.respostaUsuario ?? 'Não respondida'}
                    </p>

                    <p className="summary-answer">
                      <strong>Gabarito:</strong> {item.respostaCorreta}
                    </p>

                    <p className="summary-explanation">{item.explicacao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            className="victory-button"
            onClick={() => navigate('/')}
          >
            Continuar explorando
          </button>
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