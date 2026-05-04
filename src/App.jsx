import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import lumiLogo from './assets/images/lumi-logo.png';

function App() {
  const [isLoading, setIsLoading] = useState(true);

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
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userName !== 'visitante') {
      localStorage.setItem(`lumi_pontos_${userName}`, pontos.toString());
      localStorage.setItem(
        `lumi_concluidas_${userName}`,
        JSON.stringify(concluidas)
      );
    }
  }, [pontos, concluidas, userName]);

  if (isLoading) {
    return (
      <div className="lumi-splash-screen">
        <div className="lumi-splash-glow"></div>

        <div className="lumi-splash-content">
          <img
            src={lumiLogo}
            alt="Mascote LumiEduca"
            className="lumi-splash-logo"
          />

          <h1 className="lumi-splash-title">
            <span>Lumi</span>Educa
          </h1>

          <p className="lumi-splash-subtitle">
            Transformando o aprendizado por meio de tecnologia, gamificação e inteligência artificial.
          </p>

          <div className="lumi-splash-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Toaster />

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