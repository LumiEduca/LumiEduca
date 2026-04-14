import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateTaskPage() {
  const [pergunta, setPergunta] = useState('');
  const [opcoes, setOpcoes] = useState(['', '', '', '']); // 4 alternativas
  const [correta, setCorreta] = useState(0); // Índice da resposta certa
  const navigate = useNavigate();

  const handleOpcaoChange = (index, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = valor;
    setOpcoes(novasOpcoes);
  };

  const salvarTarefa = (e) => {
    e.preventDefault();
    
    // Validação simples
    if (opcoes.some(opt => opt === '')) {
      alert("Por favor, preencha todas as alternativas!");
      return;
    }

    const tarefasAtuais = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
    
    const novaTarefa = {
      id: Date.now(),
      pergunta,
      opcoes,
      respostaCorreta: correta, // Salva o índice (0, 1, 2 ou 3)
      tipo: 'multipla_escolha',
      criadoPor: 'Professor'
    };

    localStorage.setItem('lumi_tarefas', JSON.stringify([...tarefasAtuais, novaTarefa]));
    alert("Desafio de múltipla escolha lançado! 🚀");
    navigate('/');
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#3498db', textAlign: 'center' }}>Criar Desafio 🎓</h2>
        
        <form onSubmit={salvarTarefa}>
          <label style={labelStyle}>Pergunta do Desafio:</label>
          <textarea 
            placeholder="Ex: Quanto é 5 + 5?" 
            style={inputStyle} 
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            required
          />

          <label style={labelStyle}>Alternativas (Marque a correta):</label>
          {opcoes.map((opcao, index) => (
            <div key={index} style={opcaoRowStyle}>
              <input 
                type="radio" 
                name="correta" 
                checked={correta === index}
                onChange={() => setCorreta(index)}
                style={radioStyle}
              />
              <input 
                type="text" 
                placeholder={`Opção ${index + 1}`} 
                style={opcaoInputStyle}
                value={opcao}
                onChange={(e) => handleOpcaoChange(index, e.target.value)}
                required
              />
            </div>
          ))}

          <button type="submit" style={btnStyle}>LANÇAR PARA ALUNOS</button>
          <button type="button" onClick={() => navigate('/')} style={btnVoltarStyle}>CANCELAR</button>
        </form>
      </div>
    </div>
  );
}

// --- ESTILOS ---

const containerStyle = { padding: '40px 20px', display: 'flex', justifyContent: 'center', backgroundColor: '#f5f5f5', minHeight: '100vh' };

const cardStyle = { 
  backgroundColor: 'white', padding: '30px', borderRadius: '25px', 
  width: '100%', maxWidth: '500px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  boxSizing: 'border-box'
};

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '0.9rem' };

const inputStyle = { 
  width: '100%', padding: '15px', marginBottom: '20px', 
  borderRadius: '12px', border: '2px solid #eee', fontSize: '1rem', 
  boxSizing: 'border-box', fontFamily: 'inherit' 
};

const opcaoRowStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' };

const radioStyle = { width: '20px', height: '20px', cursor: 'pointer' };

const opcaoInputStyle = { 
  flex: 1, padding: '12px', borderRadius: '10px', 
  border: '2px solid #eee', fontSize: '0.9rem' 
};

const btnStyle = { 
  width: '100%', padding: '15px', backgroundColor: '#3498db', 
  color: 'white', border: 'none', borderRadius: '12px', 
  fontWeight: 'bold', boxShadow: '0 4px 0 #2980b9', 
  cursor: 'pointer', marginTop: '10px' 
};

const btnVoltarStyle = {
  width: '100%', padding: '10px', backgroundColor: 'transparent',
  color: '#888', border: 'none', cursor: 'pointer', marginTop: '10px',
  fontWeight: 'bold'
};