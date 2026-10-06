// Arquivo: src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/login.css';
import '../styles/register.css';
import lumiLogo from '../assets/images/lumi-logo.png';
import lumiLogin from '../assets/images/lumi-login.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function validarFormulario({ nome, usuario, senha, confirmarSenha }) {
  if (nome.trim().length < 2 || nome.trim().length > 100) {
    return 'O nome deve ter entre 2 e 100 caracteres.';
  }
  if (!/^[A-Za-z0-9._]{3,30}$/.test(usuario.trim())) {
    return 'O usuário deve ter de 3 a 30 caracteres, usando apenas letras, números, ponto ou underline.';
  }
  if (senha.length < 6 || senha.length > 72) {
    return 'A senha deve ter entre 6 e 72 caracteres.';
  }
  if (senha !== confirmarSenha) {
    return 'As senhas não conferem.';
  }
  return null;
}

function PasswordField({ id, label, placeholder, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-field">
      <label htmlFor={id} className="login-label">
        {label}
      </label>

      <div className="password-input-wrapper">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />

        <button
          type="button"
          className="password-toggle-button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? (
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
  );
}

export default function RegisterPage() {
  const [selectedProfile, setSelectedProfile] = useState('professor');
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const erroValidacao = validarFormulario({ nome, usuario, senha, confirmarSenha });
    if (erroValidacao) {
      setErrorMessage(erroValidacao);
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        selectedProfile === 'professor'
          ? '/api/v1/auth/register/professor'
          : '/api/v1/auth/register/aluno';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          usuario: usuario.trim(),
          senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao criar a conta.');
      }

      // O cadastro devolve { usuario, token }, igual ao login: o usuário já entra logado
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.usuario.tipo.toLowerCase());
      localStorage.setItem('userName', data.usuario.nome);

      window.location.href = '/';
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
      } else {
        setErrorMessage(error.message);
      }
      setIsSubmitting(false);
    }
  };

  const limparErro = () => setErrorMessage('');

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

          <h1 className="login-title register-title">Comece sua jornada no LumiEduca</h1>

          <p className="login-subtitle">
            Crie sua conta em poucos passos e comece a aprender, explorar e se divertir.
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

            <h2 className="login-card-title">Crie sua conta</h2>

            <p className="login-card-text">
              Escolha seu perfil e preencha os dados para entrar no LumiEduca.
            </p>

            <form onSubmit={handleRegister} className="login-form" noValidate>
              <div className="login-profile-selector">
                <span className="login-label">Selecione seu tipo de perfil:</span>

                <div className="login-profile-options">
                  <button
                    type="button"
                    className={`profile-option ${selectedProfile === 'professor' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProfile('professor');
                      limparErro();
                    }}
                  >
                    Professor
                  </button>

                  <button
                    type="button"
                    className={`profile-option ${selectedProfile === 'aluno' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProfile('aluno');
                      limparErro();
                    }}
                  >
                    Aluno
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="nome" className="login-label">
                  Nome
                </label>

                <input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    limparErro();
                  }}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="usuario" className="login-label">
                  Usuário
                </label>

                <input
                  id="usuario"
                  type="text"
                  placeholder="Escolha um nome de usuário"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    limparErro();
                  }}
                  autoComplete="username"
                  required
                />

                <span className="register-hint">
                  De 3 a 30 caracteres: letras, números, ponto ou underline. Você vai usar esse
                  mesmo usuário para entrar, com as mesmas letras maiúsculas e minúsculas.
                </span>
              </div>

              <PasswordField
                id="senha"
                label="Senha"
                placeholder="Crie uma senha"
                value={senha}
                autoComplete="new-password"
                onChange={(e) => {
                  setSenha(e.target.value);
                  limparErro();
                }}
              />

              <PasswordField
                id="confirmarSenha"
                label="Confirmar senha"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  limparErro();
                }}
              />

              <span className="register-hint register-hint-standalone">
                A senha precisa ter pelo menos 6 caracteres.
              </span>

              {errorMessage && (
                <p className="login-error" role="alert">
                  {errorMessage}
                </p>
              )}

              <button type="submit" className="login-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="auth-switch">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
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