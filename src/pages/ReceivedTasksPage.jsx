import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import '../styles/question.css';
import Modal from '../components/UI/Modal';
import { pedirDicaAoLumi } from '../services/aiService';
import * as atividadesService from '../services/atividadesService';
import * as salasService from '../services/salasService';

export default function ReceivedTasksPage({ setPontos }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState('');

  const [tarefaAtiva, setTarefaAtiva] = useState(null);
  const [indiceQuestao, setIndiceQuestao] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [erroMensagem, setErroMensagem] = useState('');
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

  const salaIdOrigem = location.state?.salaId || null;
  const tarefaIdOrigem = location.state?.tarefaId || null;
  const modoRevisaoOrigem = Boolean(location.state?.modoRevisao);

  const tarefaEstaConcluida = (tarefa, concluidas) => {
    return concluidas.some((c) => String(c.idTarefa) === String(tarefa.id));
  };

  const abrirAtividade = useCallback(async (idAtividade, revisar) => {
    try {
      const { atividade } = await atividadesService.obterAtividade(idAtividade);

      setTarefaAtiva(atividade);
      setIndiceQuestao(0);
      setRespostas({});
      setModoRevisao(revisar);
      setErroMensagem('');
      setExibirDica(false);
      setTextoDica('');
    } catch (erro) {
      setErroCarregar(erro.message);
    }
  }, []);

  const carregarTarefas = useCallback(async () => {
    setCarregando(true);
    setErroCarregar('');

    try {
      if (isProfessor) {
        const { atividades } = await atividadesService.listarAtividades();
        setTarefas(atividades);
        return;
      }

      const concluidas = JSON.parse(
        localStorage.getItem(`lumi_tarefas_concluidas_${nomeUsuario}`) || '[]'
      );

      let atividadesDoAluno = [];

      if (salaIdOrigem) {
        const { sala, atividades } = await salasService.listarAtividadesDaSala(salaIdOrigem);
        atividadesDoAluno = atividades.map((a) => ({
          ...a,
          salaId: sala.id,
          salaNome: sala.nome,
        }));
      } else {
        const { salas } = await salasService.listarSalas();
        const listasPorSala = await Promise.all(
          salas.map((sala) =>
            salasService
              .listarAtividadesDaSala(sala.id)
              .then(({ atividades }) =>
                atividades.map((a) => ({ ...a, salaId: sala.id, salaNome: sala.nome }))
              )
          )
        );

        const vistos = new Set();
        atividadesDoAluno = listasPorSala.flat().filter((a) => {
          if (vistos.has(a.id)) return false;
          vistos.add(a.id);
          return true;
        });
      }

      if (!salaIdOrigem) {
        atividadesDoAluno = atividadesDoAluno.filter(
          (tarefa) => !tarefaEstaConcluida(tarefa, concluidas)
        );
      }

      const tarefasComStatus = atividadesDoAluno.map((tarefa) => ({
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
          await abrirAtividade(tarefaEncontrada.id, revisar);
        }
      }
    } catch (erro) {
      setErroCarregar(erro.message);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessor, nomeUsuario, salaIdOrigem, tarefaIdOrigem, modoRevisaoOrigem]);

  useEffect(() => {
    carregarTarefas();
  }, [carregarTarefas]);

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      showCancel: false,
    }));
  };

  const questaoAtual = tarefaAtiva?.questoes[indiceQuestao];
  const ultimaQuestao = tarefaAtiva && indiceQuestao === tarefaAtiva.questoes.length - 1;
  const respostaSelecionada = questaoAtual ? respostas[questaoAtual.id] ?? null : null;
  const respondido = respostaSelecionada !== null;
  const acertouAtual = respondido && Number(respostaSelecionada) === Number(questaoAtual.respostaCorreta);

  const handlePedirAjuda = async () => {
    if (!questaoAtual) return;

    setCarregandoDica(true);
    setExibirDica(true);

    const dica = await pedirDicaAoLumi(
      questaoAtual.enunciado,
      questaoAtual.opcoes,
      tarefaAtiva.nome
    );

    setTextoDica(dica);
    setCarregandoDica(false);
  };

  const resumo = useMemo(() => {
    return { total: tarefas.length };
  }, [tarefas]);

  const handleResponderOpcao = (indiceOpcao) => {
    if (respondido) return;

    setRespostas((prev) => ({ ...prev, [questaoAtual.id]: indiceOpcao }));
    setErroMensagem('');
  };

  const voltarLista = () => {
    setTarefaAtiva(null);
    setIndiceQuestao(0);
    setRespostas({});
    setModoRevisao(false);
    setErroMensagem('');
    setExibirDica(false);
    setTextoDica('');
  };

  const finalizarAtividade = () => {
    if (modoRevisao) {
      voltarLista();
      return;
    }

    const total = tarefaAtiva.questoes.length;
    const acertos = tarefaAtiva.questoes.filter(
      (q) => Number(respostas[q.id]) === Number(q.respostaCorreta)
    ).length;
    const pontosGanhos = acertos * 10;
    const aprovouTudo = acertos === total;

    setPontos((prev) => prev + pontosGanhos);

    const historico = JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]');
    historico.unshift({
      id: Date.now(),
      aluno: nomeUsuario,
      nomeAtividade: tarefaAtiva.nome,
      salaNome: tarefas.find((t) => String(t.id) === String(tarefaAtiva.id))?.salaNome || 'Sala',
      status: aprovouTudo ? `${acertos}/${total} ✅` : `${acertos}/${total} ❌`,
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    localStorage.setItem('lumi_historico_tarefas', JSON.stringify(historico));

    const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
    const feitas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');
    const jaConcluida = feitas.some((item) => String(item.idTarefa) === String(tarefaAtiva.id));

    if (!jaConcluida) {
      feitas.push({ idTarefa: tarefaAtiva.id });
      localStorage.setItem(chaveConcluidas, JSON.stringify(feitas));
    }

    setTarefas((prev) =>
      salaIdOrigem
        ? prev.map((t) =>
            String(t.id) === String(tarefaAtiva.id) ? { ...t, concluida: true } : t
          )
        : prev.filter((t) => String(t.id) !== String(tarefaAtiva.id))
    );

    voltarLista();

    setModal({
      isOpen: true,
      title: aprovouTudo ? 'Muito bem! 🌟' : 'Resposta enviada!',
      message: `Você acertou ${acertos} de ${total} questões e ganhou ${pontosGanhos} estrelas.`,
      type: aprovouTudo ? 'info' : 'default',
      onConfirm: closeModal,
      showCancel: false,
    });
  };

  const handleAvancar = () => {
    if (!respondido) {
      setErroMensagem('Responda a questão antes de continuar.');
      return;
    }

    if (!ultimaQuestao) {
      setIndiceQuestao((prev) => prev + 1);
      setErroMensagem('');
      setExibirDica(false);
      setTextoDica('');
      return;
    }

    finalizarAtividade();
  };

  if (tarefaAtiva && questaoAtual) {
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
                Questão {indiceQuestao + 1} de {tarefaAtiva.questoes.length}
              </span>
            </div>

            <h1 className="professor-title">{questaoAtual.enunciado}</h1>

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
              Atividade: <strong>{tarefaAtiva.nome}</strong>
            </p>

            {modoRevisao && !isProfessor && (
              <p className="professor-text">
                Esta atividade já foi concluída. Você pode revisar sem ganhar pontos novamente.
              </p>
            )}

            <div className="professor-options-grid">
              {questaoAtual.opcoes.map((op, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="professor-option-btn"
                  disabled={respondido}
                  onClick={() => handleResponderOpcao(idx)}
                  style={{
                    backgroundColor: respondido
                      ? idx === Number(questaoAtual.respostaCorreta)
                        ? '#2ecc71'
                        : idx === Number(respostaSelecionada)
                          ? '#e74c3c'
                          : 'white'
                      : 'white',
                    color:
                      respondido &&
                      (idx === Number(questaoAtual.respostaCorreta) ||
                        idx === Number(respostaSelecionada))
                        ? 'white'
                        : '#1f2f4d',
                    cursor: respondido ? 'not-allowed' : 'pointer',
                  }}
                >
                  {op}
                </button>
              ))}
            </div>

            {respondido && (
              <div className={`question-feedback-box ${acertouAtual ? 'correct' : 'wrong'}`}>
                <strong>{acertouAtual ? 'Muito bem!' : 'Quase lá!'}</strong>
                <p>
                  {acertouAtual
                    ? 'Resposta correta!'
                    : `Essa não era a resposta correta. O gabarito é "${
                        questaoAtual.opcoes[questaoAtual.respostaCorreta]
                      }".`}
                </p>
              </div>
            )}

            {erroMensagem && <p className="question-error-message">{erroMensagem}</p>}

            <div className="professor-action-row question-actions-with-hint">
              {!isProfessor && !respondido && (
                <button
                  type="button"
                  className="professor-btn secondary"
                  onClick={handlePedirAjuda}
                  disabled={carregandoDica}
                >
                  {carregandoDica ? 'Chamando o Lumi...' : '🦊 Pedir dica ao Lumi'}
                </button>
              )}

              <button
                type="button"
                className="professor-btn green"
                onClick={handleAvancar}
                disabled={!respondido}
              >
                {ultimaQuestao
                  ? modoRevisao
                    ? 'Fechar revisão'
                    : 'Concluir desafio'
                  : 'Próxima questão ➜'}
              </button>
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
                  : salaIdOrigem
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

        {erroCarregar && <p className="classrooms-error">{erroCarregar}</p>}

        <div className="professor-list">
          {carregando ? (
            <div className="professor-empty">Carregando...</div>
          ) : tarefas.length === 0 ? (
            <div className="professor-empty">
              {isProfessor
                ? 'Nenhuma tarefa criada ainda.'
                : salaIdOrigem
                  ? 'Nenhum desafio encontrado nesta sala.'
                  : 'Nenhum desafio pendente no momento.'}
            </div>
          ) : (
            tarefas.map((t) => (
              <div key={t.id} className="professor-task-card">
                <div style={{ flex: 1 }}>
                  <h3 className="professor-task-title">{t.nome}</h3>

                  <p className="professor-task-meta">
                    {t.totalQuestoes} questão(ões)
                    {isProfessor
                      ? ` • ${
                          t.salas?.length
                            ? `vinculada a: ${t.salas.map((s) => s.nome).join(', ')}`
                            : 'não vinculada a nenhuma sala'
                        }`
                      : ` • Sala: ${t.salaNome}`}
                  </p>

                  <p className="professor-task-meta">
                    {isProfessor
                      ? 'Revise a atividade cadastrada.'
                      : t.concluida
                        ? 'Atividade concluída. Você pode abrir novamente para revisar.'
                        : 'Abra o desafio e responda quando estiver pronto.'}
                  </p>
                </div>

                <div className="professor-action-row" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="professor-btn orange"
                    onClick={() =>
                      abrirAtividade(t.id, isProfessor ? true : Boolean(t.concluida))
                    }
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
