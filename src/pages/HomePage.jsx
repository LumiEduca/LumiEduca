import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [pendentes, setPendentes] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // DECLARAÇÃO DA VARIÁVEL QUE ESTAVA FALTANDO:
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const carregarPendentes = () => {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const nomeUsuario = localStorage.getItem('userName') || 'visitante';
      
      // Busca a lista de conclusões específica deste aluno
      const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
      const concluidas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');

      if (userType === 'professor') {
        setPendentes(todas.length);
      } else {
        const listaPendentes = todas.filter(t => 
          !concluidas.find(c => c.idTarefa === t.id)
        );
        setPendentes(listaPendentes.length);
      }
    };

    carregarPendentes();
    return () => window.removeEventListener('resize', handleResize);
  }, [userType]); // Adicionado userType como dependência por segurança

  return (
    <div style={containerStyle}>
      {/* Agora a variável userType está definida e o erro sumirá */}
      {userType !== 'professor' && pendentes > 0 && (
        <div style={avisoTarefaStyle}>
          <span>🔔 <b>{pendentes}</b> desafio(s) esperando por você!</span>
          <button onClick={() => navigate('/tarefas-recebidas')} style={btnIrStyle}>VER AGORA</button>
        </div>
      )}

      <h1 style={{ ...tituloStyle, fontSize: isMobile ? '1.8rem' : '2.5rem' }}>
        Olá, Pequeno Explorador! 🦊
      </h1>
      
      <p style={{ ...subtituloStyle, fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
        Qual caminho vamos seguir hoje?
      </p>

      <div style={trilhaStyle}>
        <div style={faseWrapperStyle}>
          <button style={botaoMatematicaStyle} onClick={() => navigate('/trilha/matematica')}>
            ➕ Matemática
          </button>
          <span style={legendaStyle}>Desafio de Soma</span>
        </div>

        <div style={linhaStyle}></div>

        <div style={faseWrapperStyle}>
          <button style={botaoPortuguesStyle} onClick={() => navigate('/trilha/portugues')}>
            📚 Português
          </button>
          <span style={{ ...legendaStyle, color: '#aaa' }}>
            Alfabeto (Em breve)
          </span>
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const avisoTarefaStyle = { backgroundColor: '#FFF8E1', border: '2px solid #FFE082', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%', maxWidth: '400px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const btnIrStyle = { backgroundColor: '#FF8C00', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 3px 0 #CC7000' };
const containerStyle = { padding: '5% 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', minHeight: '100vh', boxSizing: 'border-box' };
const tituloStyle = { color: '#FF8C00', fontWeight: '900', textAlign: 'center', marginBottom: '10px' };
const subtituloStyle = { color: '#666', textAlign: 'center', marginBottom: '40px' };
const trilhaStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' };
const faseWrapperStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' };
const botaoMatematicaStyle = { width: '90%', maxWidth: '350px', padding: '20px', borderRadius: '25px', border: 'none', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', backgroundColor: '#FF8C00', color: 'white', boxShadow: '0 6px 0 #CC7000' };
const botaoPortuguesStyle = { ...botaoMatematicaStyle, backgroundColor: '#3498db', boxShadow: '0 6px 0 #2980b9' };
const legendaStyle = { fontWeight: 'bold', marginTop: '10px', color: '#333' };
const linhaStyle = { width: '8px', height: '40px', backgroundColor: '#eee', margin: '10px 0' };