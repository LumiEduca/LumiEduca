import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';

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
    return { total: tarefas.length };
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
      <div className="professor-page">
        <main className="professor-page-content">
          <button
            type="button"
            className="professor-back-button"
            onClick={() => setTarefaAtiva(null)}
          >
            ← Voltar para a lista
          </button>

          <section className="professor-card orange-top professor-question-card">
            <span className="professor-badge orange">
              {isProfessor ? 'Revisão do professor' : 'Desafio ativo'}
            </span>

            <h1 className="professor-title">{tarefaAtiva.pergunta}</h1>

            <p className="professor-text">
              {isProfessor
                ? 'Revise a atividade como ela aparece para os alunos.'
                : 'Escolha a alternativa correta e envie sua resposta.'}
            </p>

            <div className="professor-options-grid">
              {tarefaAtiva.opcoes.map((op, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="professor-option-btn"
                  onClick={() => !respondido && (setEscolha(idx), setRespondido(true))}
                  style={{
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
                    borderColor: escolha === idx && !respondido ? '#ff8c00' : '#e5ecf3',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

            {respondido && (
              <div className="professor-action-row">
                <button
                  type="button"
                  className="professor-btn green"
                  onClick={() => finalizarTarefa(tarefaAtiva)}
                >
                  {isProfessor ? 'Fechar revisão' : 'Concluir desafio'}
                </button>
              </div>
            )}
          </section>
        </main>

        <footer className="app-footer student-footer">
          <div className="app-footer-content student-footer-content">
            LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="professor-page">
      <main className="professor-page-content">
        <button
          type="button"
          className="professor-back-button"
          onClick={() => navigate('/')}
        >
          ← Voltar ao menu
        </button>

        <section className="professor-card blue-top">
          <span className="professor-badge">
            {isProfessor ? '🗂️ Painel de organização' : '🎓 Atividades personalizadas'}
          </span>

          <h1 className="professor-title">
            {isProfessor ? 'Gestão de desafios' : 'Desafios do professor'}
          </h1>

          <p className="professor-text">
            {isProfessor
              ? 'Crie, revise e organize atividades personalizadas para os alunos.'
              : 'Resolva as atividades enviadas pelo professor e acompanhe seu progresso.'}
          </p>

          <div className="professor-summary-grid">
            <div className="professor-summary-item">
              <span className="professor-summary-label">
                {isProfessor ? 'Desafios cadastrados' : 'Desafios pendentes'}
              </span>
              <strong className="professor-summary-value">{resumo.total}</strong>
            </div>
          </div>

          <div className="professor-action-row">
            {isProfessor && (
              <button
                type="button"
                className="professor-btn primary"
                onClick={() => navigate('/criar-tarefa')}
              >
                + Criar novo desafio
              </button>
            )}

            <button
              type="button"
              className="professor-btn secondary"
              onClick={() => navigate('/')}
            >
              Voltar ao menu
            </button>
          </div>
        </section>

        <div className="professor-list">
          {tarefas.length === 0 ? (
            <div className="professor-empty">
              {isProfessor
                ? 'Nenhuma tarefa criada ainda.'
                : 'Nenhum desafio pendente no momento.'}
            </div>
          ) : (
            tarefas.map((t) => (
              <div key={t.id} className="professor-task-card">
                <div style={{ flex: 1 }}>
                  <h3 className="professor-task-title">{t.pergunta}</h3>
                  <p className="professor-task-meta">
                    {isProfessor
                      ? 'Revise ou exclua a atividade cadastrada.'
                      : 'Abra o desafio e responda quando estiver pronto.'}
                  </p>
                </div>

                <div className="professor-action-row" style={{ marginTop: 0 }}>
                  {isProfessor && (
                    <button
                      type="button"
                      className="professor-btn outline-danger"
                      onClick={() => excluirTarefa(t.id)}
                    >
                      Excluir
                    </button>
                  )}

                  <button
                    type="button"
                    className="professor-btn orange"
                    onClick={() => setTarefaAtiva(t)}
                  >
                    {isProfessor ? 'Revisar' : 'Jogar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="app-footer student-footer">
        <div className="app-footer-content student-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}