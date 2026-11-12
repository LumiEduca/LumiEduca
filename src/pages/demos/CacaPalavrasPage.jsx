import React, { useRef, useState } from 'react';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import DemoTitulo from './DemoTitulo';
import AvaliacaoEstrelas from './AvaliacaoEstrelas';

const TAM = 10;
const PALAVRAS = ['LIVRO', 'LEITURA', 'POEMA', 'CONTO', 'LUMI', 'FABULA'];
const DIRS = [[0, 1], [1, 0], [1, 1]];
const LETRAS = 'ABCDEFGHIJLMNOPQRSTUVX';
const MSG_INICIAL = 'Segure e arraste sobre as letras da palavra!';

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

// Caminho reto (8 direções) do início até a célula sob o dedo
function caminho(l0, c0, l, c) {
  const dl = l - l0;
  const dc = c - c0;
  if (dl === 0 && dc === 0) return [[l0, c0]];
  const passo = Math.PI / 4;
  const ang = Math.round(Math.atan2(dl, dc) / passo) * passo;
  const sl = Math.round(Math.sin(ang));
  const sc = Math.round(Math.cos(ang));
  const n = Math.max(Math.abs(dl), Math.abs(dc)) + 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const ll = l0 + sl * i;
    const cc = c0 + sc * i;
    if (ll < 0 || cc < 0 || ll >= TAM || cc >= TAM) break;
    out.push([ll, cc]);
  }
  return out;
}

function celulaEm(x, y) {
  const el = document.elementFromPoint(x, y);
  const b = el && el.closest('[data-l]');
  return b ? [Number(b.dataset.l), Number(b.dataset.c)] : null;
}

export default function CacaPalavrasPage() {
  const [grade, setGrade] = useState(gerar);
  const [achadas, setAchadas] = useState({});
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState(MSG_INICIAL);
  const [humor, setHumor] = useState('feliz');
  const origem = useRef(null);
  const selRef = useRef([]);

  const total = Object.keys(achadas).length;
  const fim = total === PALAVRAS.length;

  const corDaCelula = {};
  PALAVRAS.forEach((p, i) => (achadas[p] || []).forEach((k) => { corDaCelula[k] = i; }));
  const selSet = new Set(sel.map(([l, c]) => `${l}-${c}`));

  const atualizarSel = (p) => { selRef.current = p; setSel(p); };

  const aoPressionar = (e) => {
    if (fim) return;
    const cel = celulaEm(e.clientX, e.clientY);
    if (!cel) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origem.current = cel;
    atualizarSel([cel]);
  };

  const aoMover = (e) => {
    if (!origem.current) return;
    const cel = celulaEm(e.clientX, e.clientY);
    if (!cel) return;
    atualizarSel(caminho(origem.current[0], origem.current[1], cel[0], cel[1]));
  };

  const aoSoltar = () => {
    if (!origem.current) return;
    const p = selRef.current;
    origem.current = null;
    atualizarSel([]);
    if (p.length < 2) return;

    const txt = p.map(([l, c]) => grade[l][c]).join('');
    const rev = [...txt].reverse().join('');
    const achou = PALAVRAS.find((w) => !achadas[w] && (w === txt || w === rev));

    if (achou) {
      setAchadas((a) => ({ ...a, [achou]: p.map(([l, c]) => `${l}-${c}`) }));
      const resta = PALAVRAS.length - total - 1;
      setMsg(resta === 0 ? 'Você achou todas! Parabéns!' : `Isso! Achou ${achou}! Faltam ${resta}.`);
      setHumor('comemorando');
    } else {
      setMsg('Quase! Tente de novo, você consegue!');
      setHumor('incentivando');
    }
    setTimeout(() => setHumor('feliz'), 1400);
  };

  const cancelar = () => {
    origem.current = null;
    atualizarSel([]);
  };

  const reiniciar = () => {
    setGrade(gerar());
    setAchadas({});
    atualizarSel([]);
    setHumor('feliz');
    setMsg('Novo tabuleiro! Vamos lá!');
  };

  return (
    <DemoLayout>
      <DemoTitulo etiqueta="Brincadeira" antes="Caça-" destaque="palavras" sub="Arraste o dedo sobre as letras para ligar a palavra." />
      <div className="cp-area">
        <div
          className="cp-grade"
          style={{ gridTemplateColumns: `repeat(${TAM}, var(--cell))` }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={cancelar}
        >
          {grade.map((linha, l) =>
            linha.map((letra, c) => {
              const k = `${l}-${c}`;
              const cor = corDaCelula[k];
              return (
                <div
                  key={k}
                  data-l={l}
                  data-c={c}
                  className={`cp-celula ${cor !== undefined ? `achada cor-${cor}` : ''} ${selSet.has(k) ? 'sel' : ''}`}
                >
                  {letra}
                </div>
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