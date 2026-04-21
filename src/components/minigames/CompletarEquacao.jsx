import React, { useState } from 'react';

export default function CompletarEquacao({ questao, onResponder }) {
  const [selecionado, setSelecionado] = useState(null);

  const handleOpcaoClick = (valor) => {
    setSelecionado(valor);
    // Dispara a resposta imediatamente
    const acertou = String(valor) === String(questao.correta);
    onResponder(acertou, valor);
  };

  return (
    <div className="minigame-container">
      <div className="equacao-display">
        {questao.partes.map((parte, index) => (
          <span key={index} className={parte === '?' ? 'slot-vazio' : 'parte-texto'}>
            {parte === '?' ? (selecionado || '_') : parte}
          </span>
        ))}
      </div>

      <div className="question-options-grid">
        {questao.opcoes.map((op) => (
          <button
            key={op}
            className={`question-option ${selecionado === op ? 'selected' : ''}`}
            onClick={() => handleOpcaoClick(op)}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}