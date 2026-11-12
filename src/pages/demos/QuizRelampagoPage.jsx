import React, { useEffect, useState } from 'react';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import AvaliacaoEstrelas from './AvaliacaoEstrelas';

const BANCO = [
  { p: 'Quanto é 7 + 8?', o: ['14', '15', '16'], c: 1 },
  { p: 'Qual animal é o mascote do LumiEduca?', o: ['Raposa', 'Gato', 'Coelho'], c: 0 },
  { p: 'Quantos dias tem uma semana?', o: ['5', '6', '7'], c: 2 },
  { p: 'Em qual planeta nós vivemos?', o: ['Marte', 'Terra', 'Vênus'], c: 1 },
  { p: 'Onde podemos emprestar livros?', o: ['Biblioteca', 'Padaria', 'Farmácia'], c: 0 },
  { p: 'Quanto é 6 × 4?', o: ['24', '20', '28'], c: 0 },
  { p: 'Qual é o plural de "livro"?', o: ['Livrões', 'Livros', 'Livres'], c: 1 },
  { p: 'A água do mar é...', o: ['Doce', 'Salgada', 'Sem gosto'], c: 1 },
  { p: 'Azul + amarelo = ?', o: ['Verde', 'Roxo', 'Laranja'], c: 0 },
  { p: 'Quem escreve um livro?', o: ['Autor', 'Padeiro', 'Piloto'], c: 0 },
];
const TEMPO = 15;
const sortear = () => [...BANCO].sort(() => Math.random() - 0.5).slice(0, 8);

export default function QuizRelampagoPage() {
  const [perguntas, setPerguntas] = useState(sortear);
  const [idx, setIdx] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [seq, setSeq] = useState(0);
  const [tempo, setTempo] = useState(TEMPO);
  const [escolha, setEscolha] = useState(null);
  const [fim, setFim] = useState(false);

  const q = perguntas[idx];

  const responder = (i) => {
    if (escolha !== null) return;
    setEscolha(i);
    if (i === q.c) {
      setPontos((p) => p + 10 + Math.min(seq, 3) * 5);
      setSeq((s) => s + 1);
    } else {
      setSeq(0);
    }
  };

  useEffect(() => {
    if (fim || escolha !== null) return undefined;
    if (tempo <= 0) { responder(-1); return undefined; }
    const t = setTimeout(() => setTempo((x) => x - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempo, escolha, fim]);

  useEffect(() => {
    if (escolha === null) return undefined;
    const t = setTimeout(() => {
      if (idx + 1 >= perguntas.length) setFim(true);
      else { setIdx(idx + 1); setEscolha(null); setTempo(TEMPO); }
    }, 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolha]);

  const reiniciar = () => {
    setPerguntas(sortear());
    setIdx(0); setPontos(0); setSeq(0); setTempo(TEMPO); setEscolha(null); setFim(false);
  };

  const humor = fim
    ? 'comemorando'
    : escolha === null
      ? 'feliz'
      : escolha === q.c ? 'comemorando' : 'incentivando';
  const msg = fim
    ? `Fim! Você fez ${pontos} pontos! 🎉`
    : escolha === null
      ? (seq >= 2 ? `🔥 Sequência de ${seq} acertos!` : 'Vamos lá, rápido!')
      : escolha === q.c ? 'Acertou! 🎉' : 'Ops! Na próxima você consegue!';

  return (
    <DemoLayout>
      <h1 className="demo-titulo">Quiz <span>Relâmpago</span></h1>
      <div className="quiz-area">
        <aside className="cp-lateral">
          <LumiMascote humor={humor} mensagem={msg} />
          <div className="quiz-placar">⭐ {pontos} pontos</div>
        </aside>

        {!fim && (
          <div className="quiz-caixa">
            <div className="quiz-topo">
              <span>Pergunta {idx + 1}/{perguntas.length}</span>
              <span className={tempo <= 5 ? 'quiz-tempo urgente' : 'quiz-tempo'}>⏱ {tempo}s</span>
            </div>
            <div className="quiz-barra"><div style={{ width: `${(tempo / TEMPO) * 100}%` }} /></div>
            <h2 className="quiz-pergunta">{q.p}</h2>
            <div className="quiz-opcoes">
              {q.o.map((t, i) => {
                let cls = 'quiz-opcao';
                if (escolha !== null) {
                  if (i === q.c) cls += ' certa';
                  else if (i === escolha) cls += ' errada';
                }
                return (
                  <button key={t} type="button" className={cls} onClick={() => responder(i)}>{t}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {fim && <AvaliacaoEstrelas jogo="quiz" onJogarNovamente={reiniciar} />}
    </DemoLayout>
  );
}