import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LumiMascote from './LumiMascote';
import { registrarAvaliacao } from '../../services/avaliacoesDemo';

const ROTULOS = ['', 'Poxa, pode melhorar!', 'Mais ou menos', 'Legal!', 'Muito legal!', 'Incrível!'];

const Estrela = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
  </svg>
);

export default function AvaliacaoEstrelas({ jogo, onJogarNovamente }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [enviada, setEnviada] = useState(false);

  const enviar = (n) => {
    setNota(n);
    setEnviada(true);
    registrarAvaliacao(jogo, n);
  };

  const ativa = hover || nota;

  return (
    <div className="demo-avaliacao">
      <LumiMascote humor="estrela" />
      <h3>{enviada ? 'Obrigado por brincar com a gente!' : 'O que você achou da brincadeira?'}</h3>
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
            <Estrela />
          </button>
        ))}
      </div>
      <p className="demo-estrela-rotulo">{ROTULOS[ativa] || 'Toque nas estrelinhas'}</p>
      <div className="demo-acoes">
        <button type="button" className="demo-btn demo-btn-laranja" onClick={onJogarNovamente}>
          Jogar de novo
        </button>
        <Link to="/demos" className="demo-btn demo-btn-azul">Outros jogos</Link>
      </div>
    </div>
  );
}