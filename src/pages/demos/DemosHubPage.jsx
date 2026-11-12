import React from 'react';
import { Link } from 'react-router-dom';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';

const JOGOS = [
  { to: '/demos/caca-palavras', icone: '🔎', titulo: 'Caça-palavras', texto: 'Encontre as palavras escondidas no tabuleiro!' },
  { to: '/demos/memoria', icone: '🧠', titulo: 'Jogo da Memória', texto: 'Vire as cartas e descubra os pares iguais!' },
  { to: '/demos/quiz', icone: '⚡', titulo: 'Quiz Relâmpago', texto: 'Responda rápido, ganhe pontos e faça sequências!' },
];

export default function DemosHubPage() {
  return (
    <DemoLayout voltarPara="/login" voltarTexto="← Ir para o login">
      <section className="demo-hub">
        <LumiMascote humor="feliz" mensagem="Oi! Eu sou o Lumi. Escolha um jogo para começar!" />
        <h1 className="demo-titulo">Experimente o <span>LumiEduca</span></h1>
        <p className="demo-sub">Sem login e sem cadastro. É só tocar e brincar!</p>

        <div className="demo-cards">
          {JOGOS.map((j) => (
            <Link key={j.to} to={j.to} className="demo-card">
              <span className="demo-card-icone">{j.icone}</span>
              <h2>{j.titulo}</h2>
              <p>{j.texto}</p>
              <span className="demo-btn demo-btn-laranja">Jogar</span>
            </Link>
          ))}
        </div>
      </section>
    </DemoLayout>
  );
}