import React, { useState } from 'react';
import '../styles/login.css';
import lumiLogo from '../assets/images/lumi-logo.png';
import lumiLogin from '../assets/images/lumi-login.png';

export default function LoginPage() {
  const [selectedProfile, setSelectedProfile] = useState('professor');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Limpa os erros anteriores

    if (!selectedProfile) {
      setErrorMessage('Selecione se você é professor ou aluno para continuar.');
      return;
    }

    try {
      // Define a rota baseada no perfil selecionado
      const endpoint = selectedProfile === 'professor' 
        ? '/api/v1/auth/login/professor' 
        : '/api/v1/auth/login/aluno';

      // Dispara a requisição HTTP para o backend
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, senha }),
      });

      const data = await response.json();

      // O response.ok verifica se o status HTTP está na faixa 200-299
      if (!response.ok) {
        // Utiliza a mensagem de erro padronizada que criamos no backend (ApiError)
        throw new Error(data.erro || 'Erro ao realizar login.');
      }

      // Se o login for bem-sucedido, salva o token e os dados reais no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.usuario.tipo.toLowerCase());
      localStorage.setItem('userName', data.usuario.nome);

      // Redireciona para a página principal
      window.location.href = '/';
      
    } catch (error) {
      // Captura falhas de rede (servidor desligado) ou credenciais inválidas (status 401)
      if (error.message === 'Failed to fetch') {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
      } else {
        setErrorMessage(error.message);
      }
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
                    className={`profile-option ${
                      selectedProfile === 'professor' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedProfile('professor');
                      setErrorMessage('');
                    }}
                  >
                    Professor
                  </button>

                  <button
                    type="button"
                    className={`profile-option ${
                      selectedProfile === 'aluno' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedProfile('aluno');
                      setErrorMessage('');
                    }}
                  >
                    Aluno
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

                <div className="password-input-wrapper">
                  <input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      setErrorMessage('');
                    }}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      // OLHO FECHADO
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.72-1.29 1.68-2.49 2.83-3.54" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M1 1l22 22" />
                      </svg>
                    ) : (
                      // OLHO ABERTO
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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