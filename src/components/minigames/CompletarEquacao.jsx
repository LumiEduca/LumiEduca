import React, { useState } from 'react';

export default function CompletarEquacao({ questao, onResponder }) {
  const [selecionado, setSelecionado] = useState(null);

  const handleOpcaoClick = (valor) => {
    if (selecionado !== null) return;

    setSelecionado(valor);

    const acertou = String(valor) === String(questao.correta);
    onResponder(acertou, valor);
  };

  return (
    <div className="minigame-container">
      <div className="equacao-display">
        {questao.partes.map((parte, index) => (
          <span
            key={index}
            className={parte === '?' ? 'slot-vazio centralizado-slot' : 'parte-texto'}
          >
            {parte === '?' ? (selecionado ?? '') : parte}
          </span>
        ))}
      </div>

      <div className="question-options-grid">
        {questao.opcoes.map((op) => {
          const selecionadoAtual = selecionado === op;
          const acertou = String(op) === String(questao.correta);

          return (
            <button
              key={op}
              type="button"
              disabled={selecionado !== null}
              className={`question-option
                ${selecionadoAtual ? 'selected' : ''}
                ${
                  selecionadoAtual
                    ? acertou
                      ? 'answer-correct'
                      : 'answer-wrong'
                    : ''
                }`}
              onClick={() => handleOpcaoClick(op)}
            >
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
}