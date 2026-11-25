import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import '../styles/question.css';
import Modal from '../components/UI/Modal';
import { pedirDicaAoLumi } from '../services/aiService';
import {
  listarAtividades,
  responderAtividade,
  excluirAtividade,
} from '../services/atividadeService';

export default function ReceivedTasksPage({ setPontos }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [tarefas, setTarefas] = useState([]);
  const [tarefaAtiva, setTarefaAtiva] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [escolha, setEscolha] = useState(null);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

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

  const tipoDaTarefa = (tarefa) => {
    if (tarefa.tipo === 'VERDADEIRO_FALSO') return 'VERDADEIRO_FALSO';
    if (tarefa.tipo === 'LACUNA') return 'LACUNA';
    return 'MULTIPLA_ESCOLHA';
  };

  const respostasIguais = (tarefa, resposta) => {
    const tipo = tipoDaTarefa(tarefa);
    if (tipo === 'MULTIPLA_ESCOLHA') {
      return Number(resposta) === Number(tarefa.respostaCorreta);
    }

    return String(resposta).trim().toLocaleLowerCase('pt-BR') ===
      String(tarefa.respostaCorreta).trim().toLocaleLowerCase('pt-BR');
  };

  const carregarTarefas = async () => {
    try {
      const lista = await listarAtividades();

      let visiveis = lista;
      if (!isProfessor) {
        visiveis = salaCodigoOrigem
          ? lista.filter((t) => String(t.salaCodigo) === String(salaCodigoOrigem))
          : lista.filter((t) => !t.concluida);
      }

      const tarefasComStatus = visiveis.map((t) => {
        const prazo = t.prazo ? new Date(t.prazo).getTime() : Number.NaN;
        return {
          ...t,
          atrasada: !isProfessor && !t.concluida && Number.isFinite(prazo) && prazo < Date.now(),
        };
      });

      setTarefas(tarefasComStatus);

      if (tarefaIdOrigem) {
        const tarefaEncontrada = tarefasComStatus.find(
          (t) => String(t.id) === String(tarefaIdOrigem)
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
    } catch (err) {
      setTarefas([]);
      setModal({
        isOpen: true,
        title: 'Não foi possível carregar os desafios',
        message: err.message,
        type: 'info',
        onConfirm: closeModal,
        showCancel: false,
      });
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
      tarefaAtiva.opcoes || [],
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
    return respostasIguais(tarefaAtiva, escolha);
  };

  // Aluno responde: o servidor confere, grava e devolve o gabarito. Professor e revisão só visualizam.
  const responder = async (valor) => {
    if (respondido || enviando || !tarefaAtiva) return;

    setEscolha(valor);

    if (isProfessor || modoRevisao) {
      setRespondido(true);
      return;
    }

    setEnviando(true);
    try {
      const r = await responderAtividade(tarefaAtiva.id, valor);
      setTarefaAtiva((prev) => ({ ...prev, respostaCorreta: r.respostaCorreta }));
      setResultado(r);
      setRespondido(true);
    } catch (err) {
      setEscolha(null);
      setModal({
        isOpen: true,
        title: 'Não foi possível enviar a resposta',
        message: err.message,
        type: 'info',
        onConfirm: closeModal,
        showCancel: false,
      });
    } finally {
      setEnviando(false);
    }
  };

  const finalizarTarefa = (tarefa) => {
    if (modoRevisao) {
      voltarLista();
      return;
    }

    const acertou = respostasIguais(tarefa, escolha);
    const ganhou = resultado?.pontosGanhos ?? 0;

    if (ganhou > 0 && !isProfessor) {
      setPontos((prev) => prev + ganhou);
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
      setTarefas((prev) =>
        salaCodigoOrigem
          ? prev.map((t) =>
              String(t.id) === String(tarefa.id)
                ? {
                    ...t,
                    concluida: true,
                    atrasada: false,
                    respostaCorreta: tarefa.respostaCorreta,
                  }
                : t
            )
          : prev.filter((t) => String(t.id) !== String(tarefa.id))
      );
    }

    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);
    setModoRevisao(false);
    setExibirDica(false);
    setResultado(null);

    setModal({
      isOpen: true,
      title: acertou ? 'Muito bem! 🌟' : 'Resposta enviada!',
      message: acertou
        ? ganhou > 0
          ? 'Você ganhou 10 estrelas por concluir o desafio.'
          : 'Resposta correta! Esse desafio já tinha sido concluído antes.'
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
      onConfirm: async () => {
        try {
          await excluirAtividade(id);
          setTarefas((prev) => prev.filter((t) => t.id !== id));
          closeModal();
        } catch (err) {
          setModal({
            isOpen: true,
            title: 'Não foi possível excluir',
            message: err.message,
            type: 'info',
            showCancel: false,
            onConfirm: closeModal,
          });
        }
      },
    });
  };

  const voltarLista = () => {
    setTarefaAtiva(null);
    setRespondido(false);
    setEscolha(null);
    setModoRevisao(false);
    setExibirDica(false);
    setResultado(null);
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

            {tipoDaTarefa(tarefaAtiva) === 'LACUNA' ? (
              <form
                className="professor-action-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (String(escolha || '').trim()) responder(escolha);
                }}
              >
                <input
                  className="professor-input"
                  type="text"
                  value={escolha || ''}
                  disabled={respondido || enviando}
                  onChange={(event) => setEscolha(event.target.value)}
                  placeholder="Digite sua resposta"
                  required
                />
                {!respondido && (
                  <button type="submit" className="professor-btn orange" disabled={enviando}>
                    {enviando ? 'Enviando...' : 'Responder'}
                  </button>
                )}
              </form>
            ) : (
              <div className="professor-options-grid">
                {(tipoDaTarefa(tarefaAtiva) === 'VERDADEIRO_FALSO'
                  ? ['Verdadeiro', 'Falso']
                  : tarefaAtiva.opcoes || []
                ).map((opcao, idx) => {
                  const valorResposta =
                    tipoDaTarefa(tarefaAtiva) === 'VERDADEIRO_FALSO'
                      ? opcao
                      : idx;
                  const selecionada =
                    tipoDaTarefa(tarefaAtiva) === 'VERDADEIRO_FALSO'
                      ? escolha === opcao
                      : escolha === idx;
                  const correta = respostasIguais(tarefaAtiva, valorResposta);

                  return (
                    <button
                      key={idx}
                      type="button"
                      className="professor-option-btn"
                      disabled={respondido || enviando}
                      onClick={() => responder(valorResposta)}
                      style={{
                        backgroundColor: respondido
                          ? correta
                            ? '#2ecc71'
                            : selecionada
                              ? '#e74c3c'
                              : 'white'
                          : selecionada
                            ? '#f3f4f6'
                            : 'white',
                        color: respondido && (correta || selecionada) ? 'white' : '#1f2f4d',
                        borderColor: selecionada && !respondido ? '#cbd5e1' : '#e5ecf3',
                        cursor: respondido || enviando ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {opcao}
                    </button>
                  );
                })}
              </div>
            )}

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
                  {t.materia && (
                    <p className="professor-task-meta">
                      Matéria: <strong>{t.materia}</strong>
                    </p>
                  )}
                  {t.atrasada && (
                    <span className="professor-badge orange">Atrasada</span>
                  )}
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
                    <>
                      <button
                        type="button"
                        className="professor-btn secondary"
                        onClick={() => navigate('/criar-tarefa', { state: { tarefa: t } })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="professor-btn outline-danger"
                        onClick={() => excluirTarefa(t.id)}
                      >
                        Excluir
                      </button>
                    </>
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
                      setResultado(null);
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
