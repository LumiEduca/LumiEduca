import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/victory.css';

export default function VictoryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const ganhosTrilha = location.state?.ganhos || 0;
  const errouAlguma = location.state?.errouAlguma || false;
  const resumoQuestoes = location.state?.resumoQuestoes || [];
  const materia = location.state?.materia;

  const handleContinuar = () => {
    if (materia) {
      const materiaBase = materia.split('-')[0];
      navigate(`/trilha/${materiaBase}`);
    } else {
      navigate('/');
    }
  };

  const renderTextoComSublinhado = (texto) => {
    if (typeof texto !== 'string') return texto;
    const partes = texto.split(/_(.*?)_/);
    return partes.map((parte, index) => {
      if (index % 2 !== 0) {
        return (
          <span key={index} style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
            {parte}
          </span>
        );
      }
      return parte;
    });
  };

  return (
    <div className="victory-page page-wrapper">
      <main className="victory-content">
        <section className="victory-card">
          <div className="victory-icon">🎉</div>
          <h1 className="victory-title">{errouAlguma ? 'Boa tentativa!' : 'Incrível!'}</h1>

          <div className="victory-summary">
            <h3 className="victory-summary-title">Resumo das questões</h3>
            <div className="victory-summary-list">
              {resumoQuestoes.map((item, index) => (
                <div
                  key={item.id}
                  className={`summary-item ${item.acertou ? 'correct' : 'incorrect'}`}
                >
                  <div className="summary-item-header">
                    <span>Questão {index + 1}</span>
                    <span>{item.acertou ? '✅ Correta' : '❌ Revise'}</span>
                  </div>

                  <p className="summary-question">{item.pergunta}</p>

                  <div className="summary-answer-wrapper">
                    <p className="summary-answer">
                      <strong>Sua resposta:</strong>{' '}
                      {typeof item.respostaUsuario === 'object' 
                        ? 'Conectou os pares' 
                        : renderTextoComSublinhado(item.respostaUsuario ?? 'Não respondida')}
                    </p>

                    <div className="summary-answer">
                      <strong>Gabarito:</strong>{' '}
                      {typeof item.respostaCorreta === 'object' ? (
                        <div className="summary-minigame-results">
                          {item.acertou ? (
                            <span className="minigame-success">✅ Pares conectados com sucesso!</span>
                          ) : (
                            <ul className="gabarito-list">
                              {Object.entries(item.respostaCorreta).map(([esqId, dirId]) => {
                                const par = item.pares?.find(p => p.id === esqId);
                                const alvo = item.alvos?.find(a => a.id === dirId);
                                return (
                                  <li key={esqId}>
                                    {par?.display || esqId} ↔ {alvo?.display || dirId}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <span className="summary-standard-text">
                          {renderTextoComSublinhado(item.respostaCorreta)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="victory-button" onClick={handleContinuar}>
            Continuar explorando
          </button>
        </section>
      </main>
    </div>
  );
}