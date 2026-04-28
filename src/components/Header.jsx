import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/header.css';
import logoLumi from '../assets/images/lumi-logo.png';
import Modal from './UI/Modal';

export default function Header({ pontos = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'default',
    onConfirm: null,
    onCancel: null,
  });

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

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const showInfoModal = ({ title, message, confirmText = 'Entendi' }) => {
    setModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: '',
      type: 'info',
      onConfirm: closeModal,
      onCancel: null,
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  const openLogoutModal = () => {
    setModal({
      isOpen: true,
      title: 'Deseja realmente sair?',
      message: 'Você será redirecionado para a tela de login do LumiEduca.',
      confirmText: 'Sim, sair',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: handleLogout,
      onCancel: closeModal,
    });
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      showInfoModal({
        title: 'Instalação indisponível no momento',
        message:
          'Este navegador ainda não liberou a instalação do LumiEduca. Tente novamente mais tarde ou use um navegador compatível com PWA.',
        confirmText: 'Entendi',
      });
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);

        showInfoModal({
          title: 'LumiEduca pronto para instalar!',
          message: 'A instalação foi iniciada com sucesso no seu dispositivo.',
          confirmText: 'Legal!',
        });
      }
    } catch (error) {
      console.error('Erro ao tentar instalar o app:', error);

      showInfoModal({
        title: 'Não foi possível iniciar a instalação',
        message:
          'Ocorreu um erro ao tentar instalar o LumiEduca. Verifique o navegador e tente novamente.',
        confirmText: 'Entendi',
      });
    }
  };

  const isActive = (path) => location.pathname === path;

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
            {isProfessor && (
              <nav className="header-professor-nav">
                <button
                  type="button"
                  className={`header-nav-chip ${isActive('/salas-de-aula') ? 'active' : ''}`}
                  onClick={() => navigate('/salas-de-aula')}
                >
                  🏫 Salas
                </button>

                <button
                  type="button"
                  className={`header-nav-chip ${isActive('/tarefas-recebidas') ? 'active' : ''}`}
                  onClick={() => navigate('/tarefas-recebidas')}
                >
                  🗂️ Gestão de tarefas
                </button>

                <button
                  type="button"
                  className={`header-nav-chip ${isActive('/relatorio-professor') ? 'active' : ''}`}
                  onClick={() => navigate('/relatorio-professor')}
                >
                  📊 Relatório
                </button>
              </nav>
            )}

            {!isProfessor && (
              <button
                type="button"
                className={`header-nav-chip ${isActive('/salas-de-aula') ? 'active' : ''}`}
                onClick={() => navigate('/salas-de-aula')}
              >
                🏫 Salas
              </button>
            )}

            <div className="header-score">
              <span className="score-icon">{isProfessor ? '🌟∞' : '🌟'}</span>
              <span className="score-value">{isProfessor ? 'Gestão' : pontos}</span>
            </div>

            <button className="header-btn install-btn" onClick={handleInstall}>
              Instalar
            </button>

            <button className="header-btn logout-btn" onClick={openLogoutModal}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </>
  );
}