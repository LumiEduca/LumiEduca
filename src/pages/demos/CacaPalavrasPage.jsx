import React, { useState } from 'react';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import AvaliacaoEstrelas from './AvaliacaoEstrelas';

const TAM = 10;
const PALAVRAS = ['LIVRO', 'LEITURA', 'POEMA', 'CONTO', 'LUMI', 'FABULA'];
const DIRS = [[0, 1], [1, 0], [1, 1]];
const LETRAS = 'ABCDEFGHIJLMNOPQRSTUVX';

function gerar() {
  while (true) {
    const g = Array.from({ length: TAM }, () => Array(TAM).fill(''));
    let ok = true;
    for (const p of PALAVRAS) {
      let colocada = false;
      for (let t = 0; t < 200 && !colocada; t++) {
        const [dl, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
        const l = Math.floor(Math.random() * TAM);
        const c = Math.floor(Math.random() * TAM);
        if (l + dl * (p.length - 1) >= TAM || c + dc * (p.length - 1) >= TAM) continue;
        let cabe = true;
        for (let i = 0; i < p.length; i++) {
          const x = g[l + dl * i][c + dc * i];
          if (x && x !== p[i]) { cabe = false; break; }
        }
        if (!cabe) continue;
        for (let i = 0; i < p.length; i++) g[l + dl * i][c + dc * i] = p[i];
        colocada = true;
      }
      if (!colocada) { ok = false; break; }
    }
    if (ok) {
      return g.map((linha) => linha.map((x) => x || LETRAS[Math.floor(Math.random() * LETRAS.length)]));
    }
  }
}

export default function CacaPalavrasPage() {
  const [grade, setGrade] = useState(gerar);
  const [achadas, setAchadas] = useState({});
  const [inicio, setInicio] = useState(null);
  const [msg, setMsg] = useState('Toque na primeira letra e depois na última!');
  const [humor, setHumor] = useState('feliz');

  const total = Object.keys(achadas).length;
  const fim = total === PALAVRAS.length;

  const corDaCelula = {};
  PALAVRAS.forEach((p, i) => (achadas[p] || []).forEach((k) => { corDaCelula[k] = i; }));

  const clicar = (l, c) => {
    if (fim) return;
    if (!inicio) { setInicio([l, c]); return; }
    const [l0, c0] = inicio;
    if (l0 === l && c0 === c) { setInicio(null); return; }
    const dl = l - l0;
    const dc = c - c0;
    if (!(dl === 0 || dc === 0 || Math.abs(dl) === Math.abs(dc))) { setInicio([l, c]); return; }

    const n = Math.max(Math.abs(dl), Math.abs(dc)) + 1;
    const sl = Math.sign(dl);
    const sc = Math.sign(dc);
    const cels = [];
    let txt = '';
    for (let i = 0; i < n; i++) {
      cels.push(`${l0 + sl * i}-${c0 + sc * i}`);
      txt += grade[l0 + sl * i][c0 + sc * i];
    }
    const rev = [...txt].reverse().join('');
    const achou = PALAVRAS.find((p) => !achadas[p] && (p === txt || p === rev));

    if (achou) {
      setAchadas((a) => ({ ...a, [achou]: cels }));
      const resta = PALAVRAS.length - total - 1;
      setMsg(resta === 0 ? 'Você achou todas! Parabéns! 🎉' : `Isso! Achou ${achou}! Faltam ${resta}.`);
      setHumor('comemorando');
    } else {
      setMsg('Quase! Tente de novo, você consegue!');
      setHumor('incentivando');
    }
    setInicio(null);
    setTimeout(() => setHumor('feliz'), 1200);
  };

  const reiniciar = () => {
    setGrade(gerar());
    setAchadas({});
    setInicio(null);
    setHumor('feliz');
    setMsg('Novo tabuleiro! Vamos lá!');
  };

  return (
    <DemoLayout>
      <h1 className="demo-titulo">Caça-<span>palavras</span></h1>
      <div className="cp-area">
        <div className="cp-grade" style={{ gridTemplateColumns: `repeat(${TAM}, var(--cell))` }}>
          {grade.map((linha, l) =>
            linha.map((letra, c) => {
              const k = `${l}-${c}`;
              const cor = corDaCelula[k];
              const sel = inicio && inicio[0] === l && inicio[1] === c;
              return (
                <button
                  key={k}
                  type="button"
                  className={`cp-celula ${cor !== undefined ? `achada cor-${cor}` : ''} ${sel ? 'sel' : ''}`}
                  onClick={() => clicar(l, c)}
                >
                  {letra}
                </button>
              );
            })
          )}
        </div>

        <aside className="cp-lateral">
          <LumiMascote humor={humor} mensagem={msg} />
          <div className="cp-lista">
            <h3>Palavras ({total}/{PALAVRAS.length})</h3>
            <ul>
              {PALAVRAS.map((p, i) => (
                <li key={p} className={achadas[p] ? `feita cor-${i}` : ''}>{p}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {fim && <AvaliacaoEstrelas jogo="caca-palavras" onJogarNovamente={reiniciar} />}
    </DemoLayout>
  );
}