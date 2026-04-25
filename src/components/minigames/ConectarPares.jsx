import React, { useState } from 'react';

export default function ConectarPares({ questao, onResponder }) {
  const [selecaoOrigem, setSelecaoOrigem] = useState(null);
  const [connections, setConnections] = useState({}); // Armazena { idEsquerdo: idDireito }
  const [lockedItems, setLockedItems] = useState(new Set());

  const handleLeftClick = (id) => {
    if (lockedItems.has(id)) return;
    setSelecaoOrigem(selecaoOrigem === id ? null : id);
  };

  const handleRightClick = (idAlvo) => {
    if (!selecaoOrigem || lockedItems.has(idAlvo)) return;

    // Registra a conexão
    const newConnections = { ...connections, [selecaoOrigem]: idAlvo };
    setConnections(newConnections);

    // Bloqueia ambos
    const newLocked = new Set(lockedItems);
    newLocked.add(selecaoOrigem);
    newLocked.add(idAlvo);
    setLockedItems(newLocked);
    setSelecaoOrigem(null);

    // Verifica se completou todos os pares
    const totalPares = questao.pares.length;
    if (newLocked.size === totalPares * 2) {
      // Envia o objeto de conexões para o pai validar
      onResponder(true, newConnections);
    }
  };

  return (
    <div className="minigame-container conectar-pares">
      <div className="coluna">
        {questao.pares.map((p) => (
          <button
            key={p.id}
            className={`question-option ${selecaoOrigem === p.id ? 'selected' : ''} ${lockedItems.has(p.id) ? 'locked' : ''}`}
            disabled={lockedItems.has(p.id)}
            onClick={() => handleLeftClick(p.id)}
          >
            {p.display}
          </button>
        ))}
      </div>

      <div className="coluna">
        {questao.alvos.map((a) => (
          <button
            key={a.id}
            className={`question-option ${lockedItems.has(a.id) ? 'locked' : ''}`}
            disabled={lockedItems.has(a.id)}
            onClick={() => handleRightClick(a.id)}
          >
            {a.display}
          </button>
        ))}
      </div>
    </div>
  );
}