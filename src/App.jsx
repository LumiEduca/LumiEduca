import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';

function App() {
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
      localStorage.setItem(
        `lumi_concluidas_${userName}`,
        JSON.stringify(concluidas)
      );
    }
  }, [pontos, concluidas, userName]);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {userType && <Header pontos={pontos} />}

      <AppRoutes
        userType={userType}
        setPontos={setPontos}
        concluidas={concluidas}
        setConcluidas={setConcluidas}
      />
    </div>
  );
}

export default App;