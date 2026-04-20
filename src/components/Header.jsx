import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';
import logoLumi from '../assets/images/lumi-logo.png';

export default function Header({ pontos = 0 }) {
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const userType = localStorage.getItem('userType');
  const isProfessor = userType === 'professor';

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('A instalação não está disponível neste navegador no momento.');
      return;
    }

    try {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Erro ao tentar instalar o app:', error);
      alert('Não foi possível iniciar a instalação agora.');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header-container">
          {/* Logo */}
          <button className="header-brand" onClick={handleGoHome}>
            <img
              src={logoLumi}
              alt="LumiEduca"
              className="header-logo"
            />

            <span className="header-brand-text">
              <span className="brand-lumi">Lumi</span>
              <span className="brand-educa">Educa</span>
            </span>
          </button>

          {/* Ações */}
          <div className="header-actions">
            <div className="header-score">
              <span className="score-icon">
                {isProfessor ? '🌟∞' : '🌟'}
              </span>

              <span className="score-value">
                {isProfessor ? 'Gestão' : pontos}
              </span>
            </div>

            <button
              className="header-btn install-btn"
              onClick={handleInstall}
            >
              Instalar
            </button>

            <button
              className="header-btn logout-btn"
              onClick={() => setMostrarModal(true)}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Modal sair */}
      {mostrarModal && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <h3>Deseja realmente sair? 🦊</h3>

            <div className="logout-actions">
              <button
                className="confirm-btn"
                onClick={handleLogout}
              >
                Sim, sair
              </button>

              <button
                className="cancel-btn"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}