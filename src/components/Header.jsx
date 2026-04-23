import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from "react-hot-toast";
import '../styles/header.css';
import logoLumi from '../assets/images/lumi-logo.png';
import NotificationBell from "./NotificationBell";

export default function Header({ pontos = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

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
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("💡 beforeinstallprompt disparado");
      setDeferredPrompt(e);
  };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("🔥 beforeinstallprompt disparou");
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
    setMostrarModal(false);
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('A instalação não está disponível')
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
      toast.error('Não foi possível iniciar a instalação');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header-container">
          
          <button className="header-brand" onClick={handleGoHome}>
            <img src={logoLumi} alt="LumiEduca" className="header-logo" />

            <span className="header-brand-text">
              <span className="brand-lumi">Lumi</span>
              <span className="brand-educa">Educa</span>
            </span>
          </button>

          <div className="header-actions">

            {/* 🔔 SINO */}
            <NotificationBell />

            <div className="header-score">
              <span className="score-icon">
                {isProfessor ? '🌟∞' : '🌟'}
              </span>
              <span className="score-value">
                {isProfessor ? 'Gestão' : pontos}
              </span>
            </div>

            <button className="header-btn install-btn" onClick={handleInstall}>
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

      {mostrarModal && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <h3>Deseja realmente sair? 🦊</h3>

            <div className="logout-actions">
              <button className="confirm-btn" onClick={handleLogout}>
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