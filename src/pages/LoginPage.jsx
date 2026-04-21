import React, { useState } from 'react';
import '../styles/login.css';
import lumiLogo from '../assets/images/lumi-logo.png';
import lumiLogin from '../assets/images/lumi-login.png';

export default function LoginPage() {
  const [selectedProfile, setSelectedProfile] = useState('professor');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    const SENHA_PROF = process.env.REACT_APP_SENHA_PROFESSOR;
    const SENHA_ESTUDANTE = process.env.REACT_APP_SENHA_ESTUDANTE;

    if (!selectedProfile) {
      setErrorMessage('Selecione se você é professor ou estudante para continuar.');
      return;
    }

    if (selectedProfile === 'professor') {
      if (usuario.trim().toLowerCase() === 'professor' && senha === SENHA_PROF) {
        localStorage.setItem('userType', 'professor');
        localStorage.setItem('userName', 'Professor');
        window.location.href = '/';
        return;
      }

      setErrorMessage('Credenciais de professor inválidas.');
      return;
    }

    if (selectedProfile === 'estudante') {
      if (senha === SENHA_ESTUDANTE && usuario.trim() !== '') {
        localStorage.setItem('userType', 'estudante');
        localStorage.setItem('userName', usuario.trim());
        window.location.href = '/';
        return;
      }

      setErrorMessage('Nome de usuário ou senha de estudante inválidos.');
    }
  };

  return (
    <div className="page-wrapper login-page">
      <main className="login-main">
        <section className="login-hero">
          <div className="login-brand">
            <img src={lumiLogo} alt="Ícone LumiEduca" className="login-brand-icon" />

            <div className="login-brand-text">
              <span className="login-brand-lumi">Lumi</span>
              <span className="login-brand-educa">Educa</span>
            </div>
          </div>

          <h1 className="login-title">Bem-vindo ao LumiEduca</h1>

          <p className="login-subtitle">
            Trilhe seu caminho na educação aprendendo, explorando e se divertindo.
          </p>
        </section>

        <section className="login-form-section">
          <div className="login-card">
            <div className="login-card-mascot">
              <img
                src={lumiLogin}
                alt="Mascote Lumi apoiado no card"
                className="login-card-mascot-image"
              />
            </div>

            <h2 className="login-card-title">Acesse sua jornada</h2>

            <p className="login-card-text">
              Escolha seu perfil e entre para continuar experiência no LumiEduca.
            </p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-profile-selector">
                <span className="login-label">Selecione seu tipo de perfil:</span>

                <div className="login-profile-options">
                  <button
                    type="button"
                    className={`profile-option ${selectedProfile === 'professor' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProfile('professor');
                      setErrorMessage('');
                    }}
                  >
                    Professor
                  </button>

                  <button
                    type="button"
                    className={`profile-option ${selectedProfile === 'estudante' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProfile('estudante');
                      setErrorMessage('');
                    }}
                  >
                    Estudante
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="usuario" className="login-label">
                  Usuário
                </label>
                <input
                  id="usuario"
                  type="text"
                  placeholder="Digite seu nome de usuário"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="senha" className="login-label">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                />
              </div>

              {errorMessage && <p className="login-error">{errorMessage}</p>}

              <button type="submit" className="login-submit">
                Entrar
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <div className="login-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}