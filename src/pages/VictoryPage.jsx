import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VictoryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recebe os pontos ganhos APENAS nesta trilha (enviados via navigate na Questao.jsx)
  const ganhosTrilha = location.state?.ganhos || 0;

  return (
    <div style={containerStyle}>
      <h1 style={emojiStyle}>🎉</h1>
      <h2 style={tituloStyle}>Incrível!</h2>
      <p style={textoStyle}>Você completou o desafio sem errar nada!</p>
      
      <div style={pontosCardStyle}>
        <span style={{ fontSize: '1.2rem', color: '#666' }}>Você ganhou</span>
        <h3 style={pontosDestaqueStyle}>+{ganhosTrilha}</h3>
        <span style={{ fontSize: '1.2rem', color: '#666' }}>estrelas!</span>
      </div>

      <button onClick={() => navigate('/')} style={btnStyle}>
        CONTINUAR EXPLORANDO
      </button>
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' };
const emojiStyle = { fontSize: '5rem', margin: '0' };
const tituloStyle = { fontSize: '2.5rem', color: '#FF8C00', fontWeight: '900', margin: '10px 0' };
const textoStyle = { fontSize: '1.2rem', color: '#444', marginBottom: '30px' };
const pontosCardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '40px', border: '3px solid #FF8C00' };
const pontosDestaqueStyle = { fontSize: '4rem', color: '#FF8C00', margin: '5px 0', fontWeight: '900' };
const btnStyle = { backgroundColor: '#FF8C00', color: 'white', border: 'none', padding: '18px 40px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 6px 0 #CC7000' };