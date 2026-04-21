import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReceivedTasksPage({ setPontos }) {
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState([]);
  const [tarefaAtiva, setTarefaAtiva] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState(null);

  const userType = localStorage.getItem('userType');
  const nomeUsuario = localStorage.getItem('userName') || 'visitante';
  const isProfessor = userType === 'professor';

  useEffect(() => {
    const carregarDados = () => {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const concluidas = JSON.parse(
        localStorage.getItem(`lumi_tarefas_concluidas_${nomeUsuario}`) || '[]'
      );

      if (isProfessor) {
        setTarefas(todas);
      } else {
        const pendentes = todas.filter(
          (t) => !concluidas.find((c) => c.idTarefa === t.id)
        );
        setTarefas(pendentes);
      }
    };

    carregarDados();
  }, [isProfessor, nomeUsuario]);

  const resumo = useMemo(() => {
    return {
      total: tarefas.length
    };
  }, [tarefas]);

  const finalizarTarefa = (tarefa) => {
    const indiceEscolhido = Number(escolha);
    const acertou = indiceEscolhido === Number(tarefa.respostaCorreta);

    if (acertou && !isProfessor) {
      setPontos((prev) => prev + 10);
    }

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

    if (!isProfessor) {
      const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
      const feitas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');

      feitas.push({ idTarefa: tarefa.id });
      localStorage.setItem(chaveConcluidas, JSON.stringify(feitas));

      setTarefas((prev) => prev.filter((t) => t.id !== tarefa.id));
    }

    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);

    alert(acertou ? 'Incrível! Você ganhou 10 estrelas! 🌟' : 'Resposta enviada! 💪');
  };

  const excluirTarefa = (id) => {
    if (window.confirm('Apagar este desafio para todos?')) {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const novas = todas.filter((t) => t.id !== id);

      localStorage.setItem('lumi_tarefas', JSON.stringify(novas));
      setTarefas(novas);
    }
  };

  if (tarefaAtiva) {
    return (
      <div style={pageBgStyle}>
        <div style={contentWrapStyle}>
          <button onClick={() => setTarefaAtiva(null)} style={backButtonStyle}>
            ← Voltar para a lista
          </button>

          <div style={questionCardStyle}>
            <div style={badgeStyle}>{isProfessor ? 'Revisão do professor' : 'Desafio ativo'}</div>

            <h1 style={questionTitleStyle}>{tarefaAtiva.pergunta}</h1>

            <p style={questionTextStyle}>
              {isProfessor
                ? 'Revise a atividade como ela aparece para os alunos.'
                : 'Escolha a alternativa correta e envie sua resposta.'}
            </p>

            <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
              {tarefaAtiva.opcoes.map((op, idx) => (
                <button
                  key={idx}
                  onClick={() => !respondido && (setEscolha(idx), setRespondido(true))}
                  style={{
                    ...optionButtonStyle,
                    backgroundColor: respondido
                      ? idx === tarefaAtiva.respostaCorreta
                        ? '#2ecc71'
                        : idx === escolha
                        ? '#e74c3c'
                        : 'white'
                      : escolha === idx
                      ? '#fff3e0'
                      : 'white',
                    color:
                      respondido &&
                      (idx === tarefaAtiva.respostaCorreta || idx === escolha)
                        ? 'white'
                        : '#1f2f4d',
                    borderColor:
                      escolha === idx && !respondido ? '#ff8c00' : '#e5ecf3',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

            {respondido && (
              <button onClick={() => finalizarTarefa(tarefaAtiva)} style={confirmButtonStyle}>
                {isProfessor ? 'Fechar revisão' : 'Concluir desafio'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBgStyle}>
      <div style={contentWrapStyle}>
        <div style={heroCardStyle}>
          <div style={heroBadgeStyle}>
            {isProfessor ? '🗂️ Painel de organização' : '🎓 Atividades personalizadas'}
          </div>

          <h1 style={heroTitleStyle}>
            {isProfessor ? 'Gestão de desafios' : 'Desafios do professor'}
          </h1>

          <p style={heroTextStyle}>
            {isProfessor
              ? 'Crie, revise e organize atividades personalizadas para os alunos.'
              : 'Resolva as atividades enviadas pelo professor e acompanhe seu progresso.'}
          </p>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>
              {isProfessor ? 'Desafios cadastrados' : 'Desafios pendentes'}
            </span>
            <strong style={summaryValueStyle}>{resumo.total}</strong>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '18px' }}>
            {isProfessor && (
              <button onClick={() => navigate('/criar-tarefa')} style={primaryButtonStyle}>
                + Criar novo desafio
              </button>
            )}

            <button onClick={() => navigate('/')} style={secondaryButtonStyle}>
              Voltar ao menu
            </button>
          </div>
        </div>

        <div style={listWrapStyle}>
          {tarefas.length === 0 ? (
            <div style={emptyCardStyle}>
              {isProfessor
                ? 'Nenhuma tarefa criada ainda.'
                : 'Nenhum desafio pendente no momento.'}
            </div>
          ) : (
            tarefas.map((t) => (
              <div key={t.id} style={taskCardStyle}>
                <div style={{ flex: 1 }}>
                  <strong style={taskQuestionStyle}>{t.pergunta}</strong>
                  <p style={taskMetaStyle}>
                    {isProfessor
                      ? 'Revise ou exclua a atividade cadastrada.'
                      : 'Abra o desafio e responda quando estiver pronto.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {isProfessor && (
                    <button onClick={() => excluirTarefa(t.id)} style={dangerOutlineButtonStyle}>
                      Excluir
                    </button>
                  )}

                  <button onClick={() => setTarefaAtiva(t)} style={primaryButtonStyle}>
                    {isProfessor ? 'Revisar' : 'Jogar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const pageBgStyle = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(255,140,0,0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(52,152,219,0.12), transparent 28%), #f5f7fb',
  padding: '32px 16px',
};

const contentWrapStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const heroCardStyle = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '30px',
  padding: '28px',
  boxShadow: '0 18px 38px rgba(31,41,55,0.08)',
  borderTop: '6px solid #3498db',
};

const heroBadgeStyle = {
  display: 'inline-flex',
  padding: '8px 14px',
  borderRadius: '999px',
  background: '#eaf4fb',
  color: '#2c80b9',
  fontWeight: 800,
  fontSize: '0.9rem',
  marginBottom: '16px',
};

const heroTitleStyle = {
  margin: '0 0 12px',
  color: '#1f2f4d',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  lineHeight: 1.05,
};

const heroTextStyle = {
  margin: '0',
  color: '#66738a',
  lineHeight: 1.7,
  fontSize: '1rem',
};

const summaryCardStyle = {
  marginTop: '18px',
  background: 'white',
  borderRadius: '24px',
  padding: '18px',
  boxShadow: '0 10px 24px rgba(31,41,55,0.06)',
  maxWidth: '240px',
};

const summaryLabelStyle = {
  display: 'inline-flex',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#f4f8fb',
  color: '#2c80b9',
  fontWeight: 800,
  fontSize: '0.84rem',
};

const summaryValueStyle = {
  display: 'block',
  marginTop: '14px',
  fontSize: '2.8rem',
  lineHeight: 1,
  color: '#1f2f4d',
};

const listWrapStyle = {
  display: 'grid',
  gap: '14px',
};

const emptyCardStyle = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '24px',
  padding: '28px',
  color: '#66738a',
  boxShadow: '0 10px 24px rgba(31,41,55,0.06)',
  textAlign: 'center',
};

const taskCardStyle = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '24px',
  padding: '20px',
  boxShadow: '0 10px 24px rgba(31,41,55,0.06)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const taskQuestionStyle = {
  display: 'block',
  color: '#1f2f4d',
  fontSize: '1.05rem',
  marginBottom: '6px',
};

const taskMetaStyle = {
  margin: 0,
  color: '#66738a',
  lineHeight: 1.6,
};

const questionCardStyle = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '30px',
  padding: '28px',
  boxShadow: '0 18px 38px rgba(31,41,55,0.08)',
  borderTop: '6px solid #ff8c00',
  maxWidth: '720px',
  margin: '0 auto',
  width: '100%',
};

const badgeStyle = {
  display: 'inline-flex',
  padding: '8px 14px',
  borderRadius: '999px',
  background: '#fff3e0',
  color: '#ff8c00',
  fontWeight: 800,
  fontSize: '0.9rem',
  marginBottom: '16px',
};

const questionTitleStyle = {
  margin: '0 0 12px',
  color: '#1f2f4d',
  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
  lineHeight: 1.1,
};

const questionTextStyle = {
  margin: 0,
  color: '#66738a',
  lineHeight: 1.7,
};

const optionButtonStyle = {
  padding: '14px',
  borderRadius: '16px',
  fontWeight: 800,
  border: '2px solid #e5ecf3',
  cursor: 'pointer',
  background: 'white',
};

const backButtonStyle = {
  alignSelf: 'flex-start',
  border: 'none',
  background: '#ffffff',
  color: '#1f2f4d',
  padding: '0.9rem 1.2rem',
  borderRadius: '16px',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(31, 41, 55, 0.08)',
};

const confirmButtonStyle = {
  marginTop: '20px',
  border: 'none',
  borderRadius: '16px',
  padding: '14px 22px',
  background: '#2ecc71',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 6px 0 #27ae60',
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

const dangerOutlineButtonStyle = {
  border: '2px solid #ff4d4d',
  borderRadius: '16px',
  padding: '12px 18px',
  background: 'white',
  color: '#ff4d4d',
  fontWeight: 800,
  cursor: 'pointer',
};