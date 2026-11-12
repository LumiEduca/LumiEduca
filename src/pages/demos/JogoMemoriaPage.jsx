import React, { useState } from 'react';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import AvaliacaoEstrelas from './AvaliacaoEstrelas';

const EMOJIS = ['📚', '✏️', '🎨', '🔬', '🎵', '🌎'];
const baralho = () =>
  [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, e })).sort(() => Math.random() - 0.5);

export default function JogoMemoriaPage() {
  const [cartas, setCartas] = useState(baralho);
  const [viradas, setViradas] = useState([]);
  const [pares, setPares] = useState([]);
  const [jogadas, setJogadas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [humor, setHumor] = useState('feliz');

  const fim = pares.length === EMOJIS.length;

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
        setTimeout(() => setHumor('feliz'), 1000);
      }, 500);
    } else {
      setHumor('pensando');
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
      <h1 className="demo-titulo">Jogo da <span>Memória</span></h1>
      <div className="mem-area">
        <div className="mem-grade">
          {cartas.map((c) => {
            const aberta = viradas.includes(c.id) || pares.includes(c.e);
            return (
              <button
                key={c.id}
                type="button"
                className={`mem-carta ${aberta ? 'aberta' : ''} ${pares.includes(c.e) ? 'par' : ''}`}
                onClick={() => virar(c)}
              >
                {aberta ? c.e : '?'}
              </button>
            );
          })}
        </div>
        <aside className="cp-lateral">
          <LumiMascote
            humor={humor}
            mensagem={fim ? `Você achou todos em ${jogadas} jogadas! 🎉` : `Jogadas: ${jogadas} • Pares: ${pares.length}/${EMOJIS.length}`}
          />
        </aside>
      </div>
      {fim && <AvaliacaoEstrelas jogo="memoria" onJogarNovamente={reiniciar} />}
    </DemoLayout>
  );
}