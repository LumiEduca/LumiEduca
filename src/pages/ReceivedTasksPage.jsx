import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import '../styles/question.css';
import Modal from '../components/UI/Modal';
import { pedirDicaAoLumi } from '../services/aiService';

export default function ReceivedTasksPage({ setPontos }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [tarefas, setTarefas] = useState([]);
  const [tarefaAtiva, setTarefaAtiva] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState(null);
  const [modoRevisao, setModoRevisao] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
  });

  const [exibirDica, setExibirDica] = useState(false);
  const [textoDica, setTextoDica] = useState('');
  const [carregandoDica, setCarregandoDica] = useState(false);

  const userType = localStorage.getItem('userType');
  const nomeUsuario = localStorage.getItem('userName') || 'visitante';
  const isProfessor = userType === 'professor';

  const salaCodigoOrigem = location.state?.salaCodigo || null;
  const tarefaIdOrigem = location.state?.tarefaId || null;
  const modoRevisaoOrigem = Boolean(location.state?.modoRevisao);

  const tarefaEstaConcluida = (tarefa, concluidas) => {
    return concluidas.some((c) => String(c.idTarefa) === String(tarefa.id));
  };

  const carregarTarefas = () => {
    const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
    const concluidas = JSON.parse(
      localStorage.getItem(`lumi_tarefas_concluidas_${nomeUsuario}`) || '[]'
    );

    if (isProfessor) {
      setTarefas(todas);
      return;
    }

    const codigosAluno = JSON.parse(
      localStorage.getItem(`salasEstudante_${nomeUsuario}`) || '[]'
    );

    let tarefasDoAluno = todas.filter((tarefa) => {
      if (!tarefa.salaCodigo) return true;
      return codigosAluno.includes(tarefa.salaCodigo);
    });

    if (salaCodigoOrigem) {
      tarefasDoAluno = tarefasDoAluno.filter(
        (tarefa) => String(tarefa.salaCodigo) === String(salaCodigoOrigem)
      );
    } else {
      tarefasDoAluno = tarefasDoAluno.filter(
        (tarefa) => !tarefaEstaConcluida(tarefa, concluidas)
      );
    }

    const tarefasComStatus = tarefasDoAluno.map((tarefa) => ({
      ...tarefa,
      concluida: tarefaEstaConcluida(tarefa, concluidas),
    }));

    setTarefas(tarefasComStatus);

    if (tarefaIdOrigem) {
      const tarefaEncontrada = tarefasComStatus.find(
        (tarefa) => String(tarefa.id) === String(tarefaIdOrigem)
      );

      if (tarefaEncontrada) {
        const revisar = modoRevisaoOrigem || tarefaEncontrada.concluida;

        setTarefaAtiva(tarefaEncontrada);
        setModoRevisao(revisar);
        setRespondido(false);
        setEscolha(null);
        setExibirDica(false);
      }
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, [isProfessor, nomeUsuario, salaCodigoOrigem, tarefaIdOrigem, modoRevisaoOrigem]);

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      showCancel: false,
    }));
  };

  const handlePedirAjuda = async () => {
    if (!tarefaAtiva) return;

    setCarregandoDica(true);
    setExibirDica(true);

    const dica = await pedirDicaAoLumi(
      tarefaAtiva.pergunta,
      tarefaAtiva.opcoes,
      tarefaAtiva.nomeAtividade
    );

    setTextoDica(dica);
    setCarregandoDica(false);
  };

  const resumo = useMemo(() => {
    return { total: tarefas.length };
  }, [tarefas]);

  const acertouTarefa = () => {
    if (!tarefaAtiva) return false;
    return Number(escolha) === Number(tarefaAtiva.respostaCorreta);
  };

  const finalizarTarefa = (tarefa) => {
    if (modoRevisao) {
      voltarLista();
      return;
    }

    const indiceEscolhido = Number(escolha);
    const acertou = indiceEscolhido === Number(tarefa.respostaCorreta);

    if (acertou && !isProfessor) {
      setPontos((prev) => prev + 10);
    }

    const historico = JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]');
    historico.unshift({
      id: Date.now(),
      aluno: nomeUsuario,
      nomeAtividade: tarefa.nomeAtividade || tarefa.pergunta,
      pergunta: tarefa.pergunta,
      salaNome: tarefa.salaNome || 'Geral',
      salaCodigo: tarefa.salaCodigo || null,
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
      const jaConcluida = feitas.some((item) => String(item.idTarefa) === String(tarefa.id));

      if (!jaConcluida) {
        feitas.push({ idTarefa: tarefa.id });
        localStorage.setItem(chaveConcluidas, JSON.stringify(feitas));
      }

      setTarefas((prev) =>
        salaCodigoOrigem
          ? prev.map((t) =>
              String(t.id) === String(tarefa.id) ? { ...t, concluida: true } : t
            )
          : prev.filter((t) => String(t.id) !== String(tarefa.id))
      );
    }

    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);
    setModoRevisao(false);
    setExibirDica(false);

    setModal({
      isOpen: true,
      title: acertou ? 'Muito bem! 🌟' : 'Resposta enviada!',
      message: acertou
        ? 'Você ganhou 10 estrelas por concluir o desafio.'
        : 'Sua resposta foi registrada. Continue praticando!',
      type: acertou ? 'info' : 'default',
      onConfirm: closeModal,
      showCancel: false,
    });
  };

  const excluirTarefa = (id) => {
    setModal({
      isOpen: true,
      title: 'Apagar desafio?',
      message: 'Essa atividade será removida da gestão de desafios.',
      type: 'danger',
      showCancel: true,
      onConfirm: () => {
        const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
        const novas = todas.filter((t) => t.id !== id);
        localStorage.setItem('lumi_tarefas', JSON.stringify(novas));
        setTarefas(novas);
        closeModal();
      },
    });
  };

  const voltarLista = () => {
    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);
    setModoRevisao(false);
    setExibirDica(false);
  };

  if (tarefaAtiva) {
    return (
      <div className="professor-page">
        <main className="professor-page-content">
          <button type="button" className="professor-back-button" onClick={voltarLista}>
            ← Voltar para a lista
          </button>

          <section className="professor-card orange-top professor-question-card">
            <div className="question-top">
              <span className="professor-badge orange">
                {isProfessor
                  ? 'Revisão do professor'
                  : modoRevisao
                    ? 'Revisão de atividade'
                    : 'Desafio ativo'}
              </span>
              <span className="question-progress">
                Sala: {tarefaAtiva.salaNome || 'Geral'}
              </span>
            </div>

            <h1 className="professor-title">{tarefaAtiva.pergunta}</h1>

            {exibirDica && (
              <div className={`lumi-hint-box ${carregandoDica ? 'loading' : ''}`}>
                <div className="lumi-hint-header">
                  <span>🦊 Dica do Lumi</span>
                  <button onClick={() => setExibirDica(false)} className="close-hint">
                    ×
                  </button>
                </div>
                <div className="lumi-hint-content">
                  {carregandoDica ? (
                    <p className="typing-text">O Lumi está pensando...</p>
                  ) : (
                    <p>{textoDica}</p>
                  )}
                </div>
              </div>
            )}

            <p className="professor-text">
              Atividade:{' '}
              <strong>{tarefaAtiva.nomeAtividade || 'Atividade personalizada'}</strong>
            </p>

            {modoRevisao && !isProfessor && (
              <p className="professor-text">
                Esta atividade já foi concluída. Você pode revisar sem ganhar pontos novamente.
              </p>
            )}

            <div className="professor-options-grid">
              {tarefaAtiva.opcoes.map((op, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="professor-option-btn"
                  disabled={respondido}
                  onClick={() => {
                    if (!respondido) {
                      setEscolha(idx);
                      setRespondido(true);
                    }
                  }}
                  style={{
                    backgroundColor: respondido
                      ? idx === Number(tarefaAtiva.respostaCorreta)
                        ? '#2ecc71'
                        : idx === escolha
                          ? '#e74c3c'
                          : 'white'
                      : escolha === idx
                        ? '#f3f4f6'
                        : 'white',
                    color:
                      respondido &&
                      (idx === Number(tarefaAtiva.respostaCorreta) || idx === escolha)
                        ? 'white'
                        : '#1f2f4d',
                    borderColor: escolha === idx && !respondido ? '#cbd5e1' : '#e5ecf3',
                    cursor: respondido ? 'not-allowed' : 'pointer',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

            {respondido && (
              <div className={`question-feedback-box ${acertouTarefa() ? 'correct' : 'wrong'}`}>
                <strong>{acertouTarefa() ? 'Muito bem!' : 'Quase lá!'}</strong>
                <p>
                  {acertouTarefa()
                    ? modoRevisao
                      ? 'Resposta correta! Essa revisão não altera sua pontuação.'
                      : 'Parabéns! Você acertou o desafio enviado pelo professor.'
                    : modoRevisao
                      ? 'Essa não era a resposta correta. Continue revisando para fixar melhor.'
                      : 'Sua resposta não foi a correta desta vez. Tente revisar o conceito ou peça uma dica para o próximo!'}
                </p>
              </div>
            )}

            <div className="professor-action-row">
              {isProfessor && (
                <button type="button" className="professor-btn secondary" onClick={voltarLista}>
                  Fechar revisão
                </button>
              )}

              {!isProfessor && (
                <>
                  <button
                    type="button"
                    className="professor-btn secondary"
                    onClick={handlePedirAjuda}
                    disabled={carregandoDica}
                  >
                    {carregandoDica ? 'Chamando o Lumi...' : '🦊 Pedir dica ao Lumi'}
                  </button>

                  {modoRevisao && (
                    <button
                      type="button"
                      className="professor-btn green"
                      onClick={voltarLista}
                    >
                      Fechar revisão
                    </button>
                  )}

                  {!modoRevisao && respondido && (
                    <button
                      type="button"
                      className="professor-btn green"
                      onClick={() => finalizarTarefa(tarefaAtiva)}
                    >
                      Concluir desafio
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </main>

        <footer className="app-footer student-footer">
          <div className="app-footer-content student-footer-content">
            LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
          </div>
        </footer>

        <Modal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          confirmText="Entendi"
          cancelText="Cancelar"
          type={modal.type}
          onConfirm={modal.onConfirm || closeModal}
          onCancel={modal.showCancel ? closeModal : null}
        />
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
                {isProfessor
                  ? 'Desafios cadastrados'
                  : salaCodigoOrigem
                    ? 'Desafios da sala'
                    : 'Desafios pendentes'}
              </span>
              <strong className="professor-summary-value">{resumo.total}</strong>
            </div>
          </div>

          <div className="professor-action-row">
            {isProfessor && (
              <>
                <button
                  type="button"
                  className="professor-btn primary"
                  onClick={() => navigate('/criar-tarefa')}
                >
                  + Criar novo desafio
                </button>

                <button
                  type="button"
                  className="professor-btn secondary"
                  onClick={() => navigate('/salas-de-aula')}
                >
                  Criar sala personalizada
                </button>
              </>
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
                : salaCodigoOrigem
                  ? 'Nenhum desafio encontrado nesta sala.'
                  : 'Nenhum desafio pendente no momento.'}
            </div>
          ) : (
            tarefas.map((t) => (
              <div key={t.id} className="professor-task-card">
                <div style={{ flex: 1 }}>
                  <h3 className="professor-task-title">
                    {t.nomeAtividade || t.pergunta}
                  </h3>
                  <p className="professor-task-meta">
                    Sala: <strong>{t.salaNome || 'Geral'}</strong>
                  </p>
                  <p className="professor-task-meta">
                    {isProfessor
                      ? 'Revise ou exclua a atividade cadastrada.'
                      : t.concluida
                        ? 'Atividade concluída. Você pode abrir novamente para revisar.'
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
                    onClick={() => {
                      setTarefaAtiva(t);
                      setModoRevisao(!isProfessor && Boolean(t.concluida));
                      setRespondido(false);
                      setEscolha(null);
                      setExibirDica(false);
                    }}
                  >
                    {isProfessor ? 'Revisar' : t.concluida ? 'Revisar' : 'Jogar'}
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

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.showCancel ? 'Sim, apagar' : 'Entendi'}
        cancelText="Cancelar"
        type={modal.type}
        onConfirm={modal.onConfirm || closeModal}
        onCancel={modal.showCancel ? closeModal : null}
      />
    </div>
  );
}