import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    const SENHA_PROF = process.env.REACT_APP_SENHA_PROFESSOR;
    const SENHA_ESTUDANTE = process.env.REACT_APP_SENHA_ESTUDANTE;

    if (usuario === 'professor' && senha === SENHA_PROF) {
      localStorage.setItem('userType', 'professor');
      localStorage.setItem('userName', 'Professor');
      window.location.href = '/';
    } else if (senha === SENHA_ESTUDANTE && usuario.trim() !== '') {
      // Aceita estudante, estudante2, ou qualquer nome com a senha correta
      localStorage.setItem('userType', 'estudante');
      localStorage.setItem('userName', usuario);
      window.location.href = '/';
    } else {
      alert('Usuário ou senha incorretos!');
    }
  };

  return (
    <div style={fundoStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Entrar no LumiEduca</h2>
        <input 
          type="text" 
          placeholder="Nome de Usuário" 
          style={inputStyle}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Senha" 
          style={inputStyle}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit" style={btnStyle}>ENTRAR</button>
      </form>
    </div>
  );
}

const fundoStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' };
const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '25px', width: '90%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '12px', border: '2px solid #eee', boxSizing: 'border-box', fontSize: '1rem' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 5px 0 #CC7000' };