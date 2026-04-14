import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DADOS_TRILHAS = {
  matematica: {
    nome: "Matemática",
    cor: "#FF8C00",
    fases: [
      { id: 1, nome: "Soma básica", path: "/exercicio/matematica" },
      { id: 2, nome: "Subtração", path: null },
    ]
  },
  portugues: {
    nome: "Português",
    cor: "#3498db",
    fases: [
      { id: 1, nome: "Vogais", path: null },
      { id: 2, nome: "Sílabas", path: null },
    ]
  }
};

export default function LearningPathPage() {
  const { materia } = useParams();
  const navigate = useNavigate();
  const dados = DADOS_TRILHAS[materia];

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!dados) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Trilha não encontrada!</h2>
        <button onClick={() => navigate('/')}>Voltar ao Menu</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Botão Voltar */}
      <button 
        onClick={() => navigate('/')} 
        style={{ ...btnVoltarStyle, fontSize: isMobile ? '1.2rem' : '1rem' }}
      >
        ← Menu Inicial
      </button>
      
      <h1 style={{ 
        ...tituloStyle, 
        color: dados.cor,
        fontSize: isMobile ? '1.8rem' : '2.5rem'
      }}>
        Trilha de {dados.nome}
      </h1>
      
      <div style={containerTrilhaStyle}>
        {dados.fases.map((fase) => (
          <div key={fase.id} style={wrapperFaseStyle}>
            
            <button 
              onClick={() => fase.path && navigate(fase.path)}
              disabled={!fase.path}
              style={{ 
                ...circuloStyle, 
                backgroundColor: fase.path ? dados.cor : '#ccc',
                cursor: fase.path ? 'pointer' : 'not-allowed',
                // Dinâmico: 25% da largura da tela, mas entre 80px e 120px
                width: isMobile ? 'min(25vw, 110px)' : '80px',
                height: isMobile ? 'min(25vw, 110px)' : '80px',
                fontSize: isMobile ? '2rem' : '1.5rem'
              }}
            >
              {fase.id}
            </button>

            <p style={{ 
              ...nomeFaseStyle, 
              fontSize: isMobile ? '1.3rem' : '1.1rem' 
            }}>
              {fase.nome}
            </p>
            
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ESTILOS RESPONSIVOS ---

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#fff',
  width: '100%',
  padding: '5% 5% 10% 5%', // Padding proporcional
  boxSizing: 'border-box'
};

const btnVoltarStyle = {
  alignSelf: 'flex-start',
  background: 'none',
  border: 'none',
  color: '#888',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginBottom: '20px'
};

const tituloStyle = {
  fontWeight: '900',
  marginBottom: '40px',
  textAlign: 'center',
  width: '90%'
};

const containerTrilhaStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%'
};

const wrapperFaseStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '15%', // Espaçamento entre fases baseado na altura
  width: '100%',
  position: 'relative'
};

const circuloStyle = {
  borderRadius: '50%',
  border: 'none',
  color: 'white',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 0 #bbb', // Sombra 3D sólida
  transition: 'transform 0.1s'
};

const nomeFaseStyle = {
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'center',
  marginTop: '15px',
  width: '80%'
};