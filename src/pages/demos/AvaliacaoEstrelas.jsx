import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LumiMascote from './LumiMascote';

const ROTULOS = ['', 'Poxa, pode melhorar!', 'Mais ou menos', 'Legal!', 'Muito legal!', 'Incrível!'];

export default function AvaliacaoEstrelas({ jogo, onJogarNovamente }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [enviada, setEnviada] = useState(false);

  const enviar = (n) => {
    setNota(n);
    setEnviada(true);
    try {
      const lista = JSON.parse(localStorage.getItem('lumi_demo_avaliacoes') || '[]');
      lista.push({ jogo, nota: n, data: new Date().toISOString() });
      localStorage.setItem('lumi_demo_avaliacoes', JSON.stringify(lista));
    } catch {
      /* sem armazenamento: ignora */
    }
  };

  const ativa = hover || nota;

  return (
    <div className="demo-avaliacao">
      <LumiMascote humor="estrela" />
      <h3>{enviada ? 'Obrigado por brincar com a gente! 💛' : 'O que você achou da brincadeira?'}</h3>
      <div className="demo-estrelas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={enviada}
            className={`demo-estrela ${n <= ativa ? 'ligada' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => enviar(n)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="demo-estrela-rotulo">{ROTULOS[ativa] || 'Toque nas estrelinhas'}</p>
      <div className="demo-acoes">
        <button type="button" className="demo-btn demo-btn-laranja" onClick={onJogarNovamente}>
          🔄 Jogar de novo
        </button>
        <Link to="/demos" className="demo-btn demo-btn-azul">🎮 Outros jogos</Link>
      </div>
    </div>
  );
}