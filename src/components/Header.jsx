import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/header.css';
import logoLumi from '../assets/images/lumi-logo.png';
import Modal from './UI/Modal';
import usePushNotifications from './usePushNotifications';

export default function Header({ pontos = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Confirmar',
    cancelText: 'Cancelar', type: 'default', onConfirm: null, onCancel: null,
  });

  const userType = localStorage.getItem('userType');
  const isProfessor = userType === 'professor';

  usePushNotifications();

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const showInfoModal = ({ title, message, confirmText = 'Entendi' }) => {
    setModal({ isOpen: true, title, message, confirmText, cancelText: '', type: 'info', onConfirm: closeModal, onCancel: null });
  };

  const handleGoHome = () => { navigate('/'); closeMenu(); };
  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  const openLogoutModal = () => {
    setModal({
      isOpen: true, title: 'Deseja realmente sair?',
      message: 'Você será redirecionado para a tela de login do LumiEduca.',
      confirmText: 'Sim, sair', cancelText: 'Cancelar', type: 'danger',
      onConfirm: handleLogout, onCancel: closeModal,
    });
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      showInfoModal({ title: 'Instalação indisponível', message: 'Tente usar um navegador compatível com PWA.', confirmText: 'Entendi' });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const isActive = (path) => location.pathname === path;
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

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

          {/* Navegação Desktop */}
          <nav className="header-actions desktop-nav">
            {isProfessor ? (
              <div className="header-professor-nav">
                <button type="button" className={`header-nav-chip ${isActive('/salas-de-aula') ? 'active' : ''}`} onClick={() => navigate('/salas-de-aula')}>🏫 Salas</button>
                <button type="button" className={`header-nav-chip ${isActive('/tarefas-recebidas') ? 'active' : ''}`} onClick={() => navigate('/tarefas-recebidas')}>🗂️ Gestão de tarefas</button>
                <button type="button" className={`header-nav-chip ${isActive('/relatorio-professor') ? 'active' : ''}`} onClick={() => navigate('/relatorio-professor')}>📊 Relatório</button>
              </div>
            ) : (
              <button type="button" className={`header-nav-chip ${isActive('/salas-de-aula') ? 'active' : ''}`} onClick={() => navigate('/salas-de-aula')}>🏫 Salas</button>
            )}

            <div className="header-score">
              <span className="score-icon">{isProfessor ? '🌟∞' : '🌟'}</span>
              <span className="score-value">{isProfessor ? 'Gestão' : pontos}</span>
            </div>

            <button className="header-btn install-btn" onClick={handleInstall}>Instalar</button>
            <button className="header-btn logout-btn" onClick={openLogoutModal}>Sair</button>
          </nav>

          {/* Botão Hambúrguer (Mobile) */}
          <button className="hamburger-btn" onClick={toggleMenu} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>

        {/* Menu Drop-down Mobile */}
        {isMenuOpen && (
          <div className="dropdown-menu">
            <div className="mobile-nav-links">
              {isProfessor ? (
                <>
                  <button onClick={() => {navigate('/salas-de-aula'); closeMenu();}}>🏫 Salas</button>
                  <button onClick={() => {navigate('/tarefas-recebidas'); closeMenu();}}>🗂️ Gestão de tarefas</button>
                  <button onClick={() => {navigate('/relatorio-professor'); closeMenu();}}>📊 Relatório</button>
                </>
              ) : (
                <button onClick={() => {navigate('/salas-de-aula'); closeMenu();}}>🏫 Salas</button>
              )}
              <hr />
              <button className="logout-btn-mobile" onClick={() => {openLogoutModal(); closeMenu();}}>Sair do LumiEduca</button>
            </div>
          </div>
        )}
      </header>

      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} confirmText={modal.confirmText} cancelText={modal.cancelText} type={modal.type} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />
    </>
  );
}