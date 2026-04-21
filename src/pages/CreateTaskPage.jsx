import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateTaskPage() {
  const [pergunta, setPergunta] = useState('');
  const [opcoes, setOpcoes] = useState(['', '', '', '']);
  const [correta, setCorreta] = useState(0);
  const navigate = useNavigate();

  const handleOpcaoChange = (index, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = valor;
    setOpcoes(novasOpcoes);
  };

  const salvarTarefa = (e) => {
    e.preventDefault();

    if (opcoes.some((opt) => opt.trim() === '')) {
      alert('Por favor, preencha todas as alternativas!');
      return;
    }

    const tarefasAtuais = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');

    const novaTarefa = {
      id: Date.now(),
      pergunta,
      opcoes,
      respostaCorreta: correta,
      tipo: 'multipla_escolha',
      criadoPor: 'Professor',
    };

    localStorage.setItem('lumi_tarefas', JSON.stringify([...tarefasAtuais, novaTarefa]));
    alert('Desafio de múltipla escolha lançado! 🚀');
    navigate('/tarefas-recebidas');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(255,140,0,0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(52,152,219,0.12), transparent 28%), #f5f7fb',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '30px',
          padding: '28px',
          boxShadow: '0 18px 38px rgba(31,41,55,0.08)',
          borderTop: '6px solid #3498db',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '8px 14px',
            borderRadius: '999px',
            background: '#eaf4fb',
            color: '#2c80b9',
            fontWeight: 800,
            fontSize: '0.9rem',
            marginBottom: '16px',
          }}
        >
          ✨ Novo desafio personalizado
        </div>

        <h1
          style={{
            margin: '0 0 12px',
            color: '#1f2f4d',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.05,
          }}
        >
          Criar desafio
        </h1>

        <p
          style={{
            margin: '0 0 24px',
            color: '#66738a',
            lineHeight: 1.7,
            fontSize: '1rem',
          }}
        >
          Monte uma atividade de múltipla escolha para enviar aos alunos com rapidez e organização.
        </p>

        <form onSubmit={salvarTarefa}>
          <label style={labelStyle}>Pergunta do desafio</label>
          <textarea
            placeholder="Ex: Quanto é 5 + 5?"
            style={textareaStyle}
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            required
          />

          <label style={labelStyle}>Alternativas (marque a correta)</label>

          <div style={{ display: 'grid', gap: '12px' }}>
            {opcoes.map((opcao, index) => (
              <div key={index} style={optionRowStyle}>
                <input
                  type="radio"
                  name="correta"
                  checked={correta === index}
                  onChange={() => setCorreta(index)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />

                <input
                  type="text"
                  placeholder={`Opção ${index + 1}`}
                  style={optionInputStyle}
                  value={opcao}
                  onChange={(e) => handleOpcaoChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '24px',
            }}
          >
            <button type="submit" style={primaryButtonStyle}>
              Lançar para alunos
            </button>

            <button
              type="button"
              onClick={() => navigate('/tarefas-recebidas')}
              style={secondaryButtonStyle}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 800,
  color: '#1f2f4d',
  fontSize: '0.96rem',
};

const textareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '16px',
  marginBottom: '20px',
  borderRadius: '16px',
  border: '1px solid #d9dee8',
  fontSize: '1rem',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
};

const optionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: '#f8fbff',
  border: '1px solid #d9e7f5',
  borderRadius: '18px',
  padding: '14px',
};

const optionInputStyle = {
  flex: 1,
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d9dee8',
  fontSize: '0.95rem',
  outline: 'none',
};

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '16px',
  padding: '14px 22px',
  background: '#3498db',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 6px 0 #2980b9',
};

const secondaryButtonStyle = {
  border: 'none',
  borderRadius: '16px',
  padding: '14px 22px',
  background: '#eef2f7',
  color: '#1f2f4d',
  fontWeight: 800,
  cursor: 'pointer',
};