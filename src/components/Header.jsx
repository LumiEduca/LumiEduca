import React, { useState, useEffect } from 'react';
import logoLumi from '../assets/images/lumi-logo.png';

export default function Header({ pontos }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Estado para controlar se a caixinha de "Sair" aparece
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userType');
    window.location.href = '/login';
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        
        {/* Lado Esquerdo: Logo e Nome */}
        <div style={logoGroupStyle}>
          <img 
            src={logoLumi} 
            alt="Lumi" 
            style={{ height: isMobile ? '36px' : '52px', width: 'auto' }} 
          />
          <h2 style={{ ...tituloStyle, fontSize: isMobile ? '1rem' : '1.5rem' }}>
            LumiEduca
          </h2>
        </div>

        {/* Lado Direito: Ações */}
        <div style={rightGroupStyle}>
          {deferredPrompt && (
            <button onClick={handleInstallClick} style={{
              ...installButtonStyle,
              padding: isMobile ? '6px 8px' : '8px 15px',
              fontSize: isMobile ? '0.7rem' : '0.9rem'
            }}>
              {isMobile ? "📥 PWA" : "📥 Instalar App"}
            </button>
          )}
          
          <div style={{ ...placarContainerStyle, padding: isMobile ? '4px 8px' : '5px 15px' }}>
            <span style={{ fontSize: isMobile ? '0.9rem' : '1.2rem' }}>🌟</span>
            <span style={{ ...textoPontosStyle, fontSize: isMobile ? '0.85rem' : '1.1rem' }}>
              {pontos}
            </span>
          </div>

          {/* Botão que abre o Modal */}
          <button onClick={() => setMostrarModal(true)} style={{
            ...btnLogoutStyle,
            padding: isMobile ? '6px 10px' : '8px 15px',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}>
            {isMobile ? "✖" : "Sair"}
          </button>
        </div>
      </div>

      {/* --- CAIXINHA DE CONFIRMAÇÃO (MODAL) --- */}
      {mostrarModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>
              Deseja realmente sair? 🦊
            </h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={handleLogout} style={btnConfirmarStyle}>
                SIM, SAIR
              </button>
              <button onClick={() => setMostrarModal(false)} style={btnCancelarStyle}>
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// --- NOVOS ESTILOS PARA O MODAL ---

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', // Escurece o fundo
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '25px',
  textAlign: 'center',
  width: '90%',
  maxWidth: '350px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const btnConfirmarStyle = {
  backgroundColor: '#ff4d4d',
  color: 'white',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #cc0000'
};

const btnCancelarStyle = {
  backgroundColor: '#ccc',
  color: '#333',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #999'
};

// --- ESTILOS ORIGINAIS ---

const headerStyle = {
  backgroundColor: 'white',
  padding: '10px 3%', 
  borderBottom: '2px solid #e5e5e5',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  boxSizing: 'border-box',
  width: '100%'
};

const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%'
};

const logoGroupStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const rightGroupStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const tituloStyle = { fontWeight: '900', color: '#FF8C00', margin: 0, whiteSpace: 'nowrap' };
const installButtonStyle = { backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 3px 0 #CC7000' };
const placarContainerStyle = { backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', borderRadius: '15px', border: '2px solid #ddd', gap: '4px' };
const textoPontosStyle = { fontWeight: '900', color: '#555' };
const btnLogoutStyle = { backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 3px 0 #cc0000' };