import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import lumiLogo from '../../assets/images/lumi-logo.png';
import { enviarPendentes } from '../../services/avaliacoesDemo';
import './demos.css';

export default function DemoLayout({ children, voltarPara = '/demos', voltarTexto = 'Outros jogos' }) {
  const [telaCheia, setTelaCheia] = useState(false);

  useEffect(() => {
    const f = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  useEffect(() => {
    enviarPendentes();
    window.addEventListener('online', enviarPendentes);
    return () => window.removeEventListener('online', enviarPendentes);
  }, []);

  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="demo-pagina">
      <header className="demo-header">
        <Link to="/demos" className="demo-marca">
          <img src={lumiLogo} alt="" />
          <span><b>Lumi</b>Educa</span>
        </Link>
        <div className="demo-header-acoes">
          <Link to={voltarPara} className="demo-btn demo-btn-claro">{voltarTexto}</Link>
          <button type="button" className="demo-btn demo-btn-claro" onClick={alternar}>
            {telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          </button>
        </div>
      </header>

      <main className="demo-main">{children}</main>

      <footer className="demo-footer">
        LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
      </footer>
    </div>
  );
}