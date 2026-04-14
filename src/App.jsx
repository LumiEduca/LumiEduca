import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';

function App() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'visitante';
  const userType = localStorage.getItem('userType');

  const [pontos, setPontos] = useState(() => {
    const salvo = localStorage.getItem(`lumi_pontos_${userName}`);
    return salvo ? parseInt(salvo, 10) : 0;
  });

  const [concluidas, setConcluidas] = useState(() => {
    const salvo = localStorage.getItem(`lumi_concluidas_${userName}`);
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    if (userName !== 'visitante') {
      localStorage.setItem(`lumi_pontos_${userName}`, pontos.toString());
      localStorage.setItem(`lumi_concluidas_${userName}`, JSON.stringify(concluidas));
    }
  }, [pontos, concluidas, userName]);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {userType && <Header pontos={pontos} />}

      {userType === 'professor' && (
        <div style={adminBannerStyle}>
          <span style={{ fontWeight: 'bold' }}>Área do Professor 🎓</span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/tarefas-recebidas')}
              style={btnCriarTarefaStyle}
            >
              📂 GESTÃO DE TAREFAS
            </button>

            <button
              onClick={() => navigate('/relatorio')}
              style={btnRelatorioStyle}
            >
              📊 RELATÓRIO
            </button>
          </div>
        </div>
      )}

      <AppRoutes
        userType={userType}
        setPontos={setPontos}
        concluidas={concluidas}
        setConcluidas={setConcluidas}
      />
    </div>
  );
}

const adminBannerStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '20px',
  padding: '12px 20px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  flexWrap: 'wrap',
};

const btnCriarTarefaStyle = {
  backgroundColor: '#fff',
  color: '#3498db',
  border: 'none',
  padding: '6px 15px',
  borderRadius: '8px',
  fontWeight: '900',
  cursor: 'pointer',
  fontSize: '0.8rem',
  boxShadow: '0 3px 0 #2980b9',
};

const btnRelatorioStyle = {
  ...btnCriarTarefaStyle,
  backgroundColor: '#2ecc71',
  color: 'white',
  boxShadow: '0 3px 0 #27ae60',
};

export default App;