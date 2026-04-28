import React, { useMemo, useState } from 'react';

export default function ConectarPares({ questao, onResponder }) {
  const [selecaoOrigem, setSelecaoOrigem] = useState(null);
  const [connections, setConnections] = useState({});
  const [lockedItems, setLockedItems] = useState(new Set());
  const [resultado, setResultado] = useState(null);
  const [finalizado, setFinalizado] = useState(false);

  const alvosEmbaralhados = useMemo(() => {
    return [...questao.alvos].sort(() => Math.random() - 0.5);
  }, [questao]);

  const handleLeftClick = (id) => {
    if (finalizado) return;
    if (lockedItems.has(id)) return;

    setSelecaoOrigem((prev) => (prev === id ? null : id));
  };

  const handleRightClick = (idAlvo) => {
    if (finalizado) return;
    if (!selecaoOrigem) return;
    if (lockedItems.has(idAlvo)) return;

    const novaConexao = {
      ...connections,
      [selecaoOrigem]: idAlvo,
    };

    const novosBloqueados = new Set(lockedItems);
    novosBloqueados.add(selecaoOrigem);
    novosBloqueados.add(idAlvo);

    setConnections(novaConexao);
    setLockedItems(novosBloqueados);
    setSelecaoOrigem(null);

    const totalPares = questao.pares.length;

    if (Object.keys(novaConexao).length === totalPares) {
      const mapaResultado = {};
      let acertouTudo = true;

      questao.pares.forEach((par) => {
        const alvoEscolhido = novaConexao[par.id];
        const alvoCorreto = questao.correta[par.id];
        const acertou = alvoEscolhido === alvoCorreto;

        mapaResultado[par.id] = acertou;
        mapaResultado[alvoEscolhido] = acertou;

        if (!acertou) {
          acertouTudo = false;
        }
      });

      setResultado(mapaResultado);
      setFinalizado(true);

      setTimeout(() => {
        onResponder(acertouTudo, novaConexao);
      }, 500);
    }
  };

  return (
    <div className="minigame-container">
      <div className="connect-columns">
        <div className="coluna">
          {questao.pares.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`question-option ${
                selecaoOrigem === p.id ? 'selected-connect' : ''
              } ${
                resultado && resultado[p.id] === true ? 'answer-correct' : ''
              } ${
                resultado && resultado[p.id] === false ? 'answer-wrong' : ''
              } ${
                lockedItems.has(p.id) ? 'locked' : ''
              }`}
              disabled={finalizado}
              onClick={() => handleLeftClick(p.id)}
            >
              {p.display}
            </button>
          ))}
        </div>

        <div className="connect-arrow-area">
          <span className="arrow-text">→</span>
          <small>Ligue aqui</small>
        </div>

        <div className="coluna">
          {alvosEmbaralhados.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`question-option ${
                resultado && resultado[a.id] === true ? 'answer-correct' : ''
              } ${
                resultado && resultado[a.id] === false ? 'answer-wrong' : ''
              } ${
                lockedItems.has(a.id) ? 'locked' : ''
              }`}
              disabled={finalizado}
              onClick={() => handleRightClick(a.id)}
            >
              {a.display}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}