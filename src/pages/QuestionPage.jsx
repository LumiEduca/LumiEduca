import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bancoDeQuestoes } from '../data/questoes';

export default function QuestionPage({ setPontos, concluidas, setConcluidas }) {
  const { materia } = useParams();
  const navigate = useNavigate();
  const questoes = bancoDeQuestoes[materia] || [];

  const [indice, setIndice] = useState(0);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState(null);
  const [errouAlguma, setErrouAlguma] = useState(false);
  
  // SOLUÇÃO PROBLEMA 1: Estado para rastrear pontos APENAS desta trilha
  const [ganhosSessao, setGanhosSessao] = useState(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const questaoAtual = questoes[indice];
  const idUnico = `${materia}-${questaoAtual?.id}`;

  const conferir = (valor) => {
    if (respondido) return;
    setEscolha(valor);
    setRespondido(true);

    if (valor === questaoAtual.correta) {
      if (!concluidas.includes(idUnico)) {
        setPontos(prev => prev + 10);
        setConcluidas(prev => [...prev, idUnico]);
        // Incrementa o que foi ganho nesta rodada específica
        setGanhosSessao(prev => prev + 10);
      }
    } else {
      setErrouAlguma(true);
    }
  };

  const proximo = () => {
    if (indice < questoes.length - 1) {
      setIndice(indice + 1);
      setRespondido(false);
      setEscolha(null);
    } else {
      if (errouAlguma) {
        alert("Ops! Você errou algumas. Tente acertar todas para ganhar a medalha!");
        navigate(`/trilha/${materia}`);
      } else {
        // SOLUÇÃO PROBLEMA 1: Passamos os ganhos da sessão via state do React Router
        navigate('/vitoria', { state: { ganhos: ganhosSessao } });
      }
    }
  };

  if (!questaoAtual) return null;

  return (
    <div style={cardStyle}>
      <p style={{ color: '#888', fontWeight: 'bold', fontSize: '0.9rem' }}>
        Questão {indice + 1} de {questoes.length}
      </p>

      <h2 style={{ 
        ...perguntaStyle,
        fontSize: isMobile ? '1.4rem' : '1.8rem' 
      }}>
        {questaoAtual.pergunta}
      </h2>

      <div style={{ 
        ...gridStyle, 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' 
      }}>
        {questaoAtual.opcoes.map((op) => {
          const isCorreta = op === questaoAtual.correta;
          const isEscolhida = op === escolha;
          
          let bgColor = 'white';
          let textColor = 'black';

          if (respondido) {
            if (isCorreta) {
              bgColor = '#2ecc71';
              textColor = 'white';
            } else if (isEscolhida) {
              bgColor = '#e74c3c';
              textColor = 'white';
            }
          }

          return (
            <button 
              key={op} 
              style={{ 
                ...btnRespostaStyle,
                backgroundColor: bgColor,
                color: textColor,
                border: respondido ? 'none' : '2px solid #e5e5e5',
                boxShadow: !respondido ? '0 5px 0 #e5e5e5' : 'none',
                padding: isMobile ? '22px 15px' : '20px'
              }}
              onClick={() => conferir(op)}
            >
              {op}
            </button>
          );
        })}
      </div>

      {respondido && (
        <button 
          onClick={proximo} 
          style={btnProximoStyle}
        >
          {indice < questoes.length - 1 ? "PRÓXIMA PERGUNTA ➔" : "VER MEUS PONTOS 🏆"}
        </button>
      )}
    </div>
  );
}

// Estilos mantidos conforme o original...
const cardStyle = { backgroundColor: 'white', margin: '30px auto', textAlign: 'center', borderRadius: '25px', boxShadow: '0 8px 25px rgba(0,0,0,0.06)', width: '92%', maxWidth: '500px', padding: '5%', boxSizing: 'border-box' };
const perguntaStyle = { marginBottom: '30px', color: '#333', fontWeight: '900', lineHeight: '1.2' };
const gridStyle = { display: 'grid', gap: '12px', width: '100%' };
const btnRespostaStyle = { borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' };
const btnProximoStyle = { marginTop: '30px', width: '100%', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', padding: '18px', fontSize: '1.1rem', boxShadow: '0 6px 0 #CC7000' };