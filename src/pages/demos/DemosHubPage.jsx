import React from 'react';
import { Link } from 'react-router-dom';
import DemoLayout from './DemoLayout';
import LumiMascote from './LumiMascote';
import DemoTitulo from './DemoTitulo';

const svgProps = {
  viewBox: '0 0 24 24', width: 44, height: 44, fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
};

const JOGOS = [
  {
    to: '/demos/caca-palavras', titulo: 'Caça-palavras', cor: '#ff8c00',
    texto: 'Arraste o dedo sobre as letras e encontre as palavras escondidas.',
    icone: <svg {...svgProps}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.9-4.9" /></svg>,
  },
  {
    to: '/demos/memoria', titulo: 'Jogo da Memória', cor: '#3b82f6',
    texto: 'Vire as cartas e descubra os pares iguais.',
    icone: <svg {...svgProps}><rect x="3" y="4" width="11" height="15" rx="2" /><rect x="10" y="7" width="11" height="15" rx="2" /></svg>,
  },
  {
    to: '/demos/quiz', titulo: 'Quiz Relâmpago', cor: '#2e9e5b',
    texto: 'Responda rápido, ganhe pontos e faça sequências de acertos.',
    icone: <svg {...svgProps}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>,
  },
];

export default function DemosHubPage() {
  return (
    <DemoLayout voltarPara="/login" voltarTexto="Ir para o login">
      <section className="demo-hub">
        <LumiMascote humor="feliz" mensagem="Oi! Eu sou o Lumi. Escolha uma brincadeira!" />
        <DemoTitulo
          etiqueta="Demonstrações"
          antes="Experimente o"
          destaque="LumiEduca"
          sub="Sem login e sem cadastro. É só tocar e brincar!"
        />

        <div className="demo-cards">
          {JOGOS.map((j) => (
            <Link key={j.to} to={j.to} className="demo-card" style={{ '--cor': j.cor }}>
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