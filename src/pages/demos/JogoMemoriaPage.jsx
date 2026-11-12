import React, { useState } from 'react';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import DemoTitulo from './DemoTitulo';
import AvaliacaoEstrelas from './AvaliacaoEstrelas';
import lumiLogo from '../../assets/images/lumi-logo.png';

const ICONES = {
  livro: (
    <svg viewBox="0 0 64 64">
      <path fill="#3b82f6" d="M8 12h20a6 6 0 0 1 6 6v34a5 5 0 0 0-5-5H8z" />
      <path fill="#60a5fa" d="M56 12H36a6 6 0 0 0-6 6v34a5 5 0 0 1 5-5h21z" />
    </svg>
  ),
  lapis: (
    <svg viewBox="0 0 64 64">
      <polygon fill="#ff8c00" points="12,52 16,38 44,10 54,20 26,48" />
      <polygon fill="#1e2d50" points="12,52 16,38 26,48" />
      <polygon fill="#ec4899" points="44,10 50,4 60,14 54,20" />
    </svg>
  ),
  estrela: (
    <svg viewBox="0 0 64 64">
      <polygon fill="#ffb400" points="32,6 39,24 58,24 43,36 49,56 32,44 15,56 21,36 6,24 25,24" />
    </svg>
  ),
  musica: (
    <svg viewBox="0 0 64 64">
      <path fill="none" stroke="#a855f7" strokeWidth="6" strokeLinecap="round" d="M24 46V14l28-6v32" />
      <circle cx="18" cy="48" r="9" fill="#a855f7" />
      <circle cx="46" cy="42" r="9" fill="#a855f7" />
    </svg>
  ),
  globo: (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="26" fill="#3b82f6" />
      <path fill="#2e9e5b" d="M18 20c6-4 12-2 14 4s-6 8-8 14-8 2-10-4 0-10 4-14zM38 36c6-2 12 2 12 8s-6 8-10 6-6-12-2-14z" />
    </svg>
  ),
  frasco: (
    <svg viewBox="0 0 64 64">
      <path fill="#14b8a6" d="M26 6h12v18l14 26a6 6 0 0 1-5 9H17a6 6 0 0 1-5-9l14-26z" />
      <path fill="#99f6e4" d="M20 42h24l6 10a3 3 0 0 1-3 5H17a3 3 0 0 1-3-5z" />
    </svg>
  ),
};

const CHAVES = Object.keys(ICONES);
const baralho = () =>
  [...CHAVES, ...CHAVES].map((e, i) => ({ id: i, e })).sort(() => Math.random() - 0.5);

export default function JogoMemoriaPage() {
  const [cartas, setCartas] = useState(baralho);
  const [viradas, setViradas] = useState([]);
  const [pares, setPares] = useState([]);
  const [jogadas, setJogadas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [humor, setHumor] = useState('feliz');

  const fim = pares.length === CHAVES.length;

  const virar = (carta) => {
    if (travado || viradas.includes(carta.id) || pares.includes(carta.e)) return;
    const nova = [...viradas, carta.id];
    setViradas(nova);
    if (nova.length < 2) return;

    setJogadas((j) => j + 1);
    const [a, b] = nova.map((id) => cartas.find((x) => x.id === id));
    setTravado(true);
    if (a.e === b.e) {
      setTimeout(() => {
        setPares((p) => [...p, a.e]);
        setViradas([]);
        setTravado(false);
        setHumor('comemorando');
        setTimeout(() => setHumor('feliz'), 1200);
      }, 500);
    } else {
      setHumor('incentivando');
      setTimeout(() => {
        setViradas([]);
        setTravado(false);
        setHumor('feliz');
      }, 1000);
    }
  };

  const reiniciar = () => {
    setCartas(baralho());
    setViradas([]);
    setPares([]);
    setJogadas(0);
    setTravado(false);
    setHumor('feliz');
  };

  return (
    <DemoLayout>
      <DemoTitulo etiqueta="Brincadeira" antes="Jogo da" destaque="Memória" sub="Vire duas cartas por vez e encontre os pares." />
      <div className="mem-area">
        <div className="mem-grade">
          {cartas.map((c) => {
            const par = pares.includes(c.e);
            const aberta = viradas.includes(c.id) || par;
            return (
              <button
                key={c.id}
                type="button"
                className={`mem-carta ${aberta ? 'aberta' : ''} ${par ? 'par' : ''}`}
                onClick={() => virar(c)}
              >
                {aberta ? ICONES[c.e] : <img src={lumiLogo} alt="" />}
              </button>
            );
          })}
        </div>
        <aside className="cp-lateral">
          <LumiMascote
            humor={fim ? 'comemorando' : humor}
            mensagem={fim ? `Você achou todos em ${jogadas} jogadas!` : `Jogadas: ${jogadas} • Pares: ${pares.length}/${CHAVES.length}`}
          />
        </aside>
      </div>
      {fim && <AvaliacaoEstrelas jogo="memoria" onJogarNovamente={reiniciar} />}
    </DemoLayout>
  );
}