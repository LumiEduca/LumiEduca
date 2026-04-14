import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReceivedTasksPage({ setPontos }) {
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState([]);
  const userType = localStorage.getItem('userType');
  const nomeUsuario = localStorage.getItem('userName') || 'visitante';

  const [tarefaAtiva, setTarefaAtiva] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState(null);

  useEffect(() => {
    const carregarDados = () => {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');

      // Chave de conclusão única por aluno
      const concluidas = JSON.parse(
        localStorage.getItem(`lumi_tarefas_concluidas_${nomeUsuario}`) || '[]'
      );

      if (userType === 'professor') {
        setTarefas(todas);
      } else {
        const pendentes = todas.filter(
          (t) => !concluidas.find((c) => c.idTarefa === t.id)
        );
        setTarefas(pendentes);
      }
    };

    carregarDados();
  }, [userType, nomeUsuario]);

  const finalizarTarefa = (tarefa) => {
    const indiceEscolhido = Number(escolha);
    const acertou = indiceEscolhido === Number(tarefa.respostaCorreta);

    // 1. Ganho de Pontos (Sincronizado com App.jsx)
    if (acertou && userType !== 'professor') {
      setPontos((prev) => prev + 10);
    }

    // 2. Histórico para o Professor (Global para o relatório)
    const historico = JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]');

    historico.unshift({
      id: Date.now(),
      aluno: nomeUsuario,
      pergunta: tarefa.pergunta,
      status: acertou ? 'Acertou ✅' : 'Errou ❌',
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    localStorage.setItem('lumi_historico_tarefas', JSON.stringify(historico));

    // 3. Persistência de Conclusão (Única por aluno)
    if (userType !== 'professor') {
      const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
      const feitas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');

      feitas.push({ idTarefa: tarefa.id });

      localStorage.setItem(chaveConcluidas, JSON.stringify(feitas));

      // Remove da lista visual
      setTarefas((prev) => prev.filter((t) => t.id !== tarefa.id));
    }

    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);

    alert(
      acertou
        ? 'Incrível! Você ganhou 10 estrelas! 🌟'
        : 'Resposta enviada! 💪'
    );
  };

  const excluirTarefa = (id) => {
    if (window.confirm('Apagar este desafio para todos?')) {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const novas = todas.filter((t) => t.id !== id);

      localStorage.setItem('lumi_tarefas', JSON.stringify(novas));
      setTarefas(novas);
    }
  };

  // Renderização da Questão Ativa
  if (tarefaAtiva) {
    return (
      <div style={containerStyle}>
        <div style={cardQuestaoStyle}>
          <h2>{tarefaAtiva.pergunta}</h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '20px',
            }}
          >
            {tarefaAtiva.opcoes.map((op, idx) => (
              <button
                key={idx}
                onClick={() =>
                  !respondido &&
                  (setEscolha(idx) || setRespondido(true))
                }
                style={{
                  ...btnOpcaoStyle,
                  backgroundColor: respondido
                    ? idx === tarefaAtiva.respostaCorreta
                      ? '#2ecc71'
                      : idx === escolha
                      ? '#e74c3c'
                      : 'white'
                    : escolha === idx
                    ? '#eee'
                    : 'white',
                  color:
                    respondido &&
                    (idx === tarefaAtiva.respostaCorreta ||
                      idx === escolha)
                      ? 'white'
                      : 'black',
                }}
              >
                {op}
              </button>
            ))}
          </div>

          {respondido && (
            <button
              onClick={() => finalizarTarefa(tarefaAtiva)}
              style={btnFinalizarStyle}
            >
              CONCLUIR DESAFIO
            </button>
          )}
        </div>
      </div>
    );
  }

  // Renderização da Lista de Tarefas
  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#FF8C00' }}>
        {userType === 'professor'
          ? 'Gestão de Desafios ⚙️'
          : 'Desafios do Mestre 🎓'}
      </h1>

      {/* BOTÃO EXCLUSIVO PARA PROFESSOR CRIAR NOVA TAREFA */}
      {userType === 'professor' && (
        <button
          onClick={() => navigate('/criar-tarefa')}
          style={btnNovaTarefaStyle}
        >
          ➕ CRIAR NOVO DESAFIO
        </button>
      )}

      <div style={gridTarefasStyle}>
        {tarefas.length === 0 ? (
          <p>Nenhuma tarefa criada ainda.</p>
        ) : (
          tarefas.map((t) => (
            <div key={t.id} style={itemTarefaStyle}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block' }}>
                  {t.pergunta.substring(0, 25)}...
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {userType === 'professor' && (
                  <button
                    onClick={() => excluirTarefa(t.id)}
                    style={btnLixeiraStyle}
                  >
                    🗑️
                  </button>
                )}

                <button
                  onClick={() => setTarefaAtiva(t)}
                  style={btnJogarStyle}
                >
                  {userType === 'professor' ? 'REVISAR' : 'JOGAR'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        style={btnVoltarStyle}
      >
        VOLTAR AO MENU
      </button>
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = {
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const gridTarefasStyle = {
  width: '100%',
  maxWidth: '500px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginTop: '20px',
};

const itemTarefaStyle = {
  backgroundColor: 'white',
  padding: '15px 20px',
  borderRadius: '15px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
};

const btnJogarStyle = {
  backgroundColor: '#FF8C00',
  color: 'white',
  border: 'none',
  padding: '8px 15px',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 3px 0 #CC7000',
};

const btnVoltarStyle = {
  marginTop: '30px',
  border: 'none',
  background: 'none',
  color: '#888',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const cardQuestaoStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '25px',
  width: '90%',
  maxWidth: '400px',
  textAlign: 'center',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
};

const btnOpcaoStyle = {
  padding: '12px',
  borderRadius: '10px',
  fontWeight: 'bold',
  border: '2px solid #eee',
  cursor: 'pointer',
};

const btnFinalizarStyle = {
  marginTop: '20px',
  width: '100%',
  padding: '12px',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #27ae60',
};

const btnNovaTarefaStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '15px 25px',
  borderRadius: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginBottom: '20px',
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 4px 0 #2980b9',
};

const btnLixeiraStyle = {
  backgroundColor: 'transparent',
  border: '2px solid #ff4d4d',
  borderRadius: '10px',
  cursor: 'pointer',
  padding: '5px 8px',
};