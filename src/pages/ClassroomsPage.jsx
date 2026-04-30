import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/classrooms.css';
import { showLumiNotification } from '../services/notificationClient';

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function carregarSalas() {
  try {
    return JSON.parse(localStorage.getItem('salas')) || [];
  } catch {
    return [];
  }
}

function salvarSalas(salas) {
  localStorage.setItem('salas', JSON.stringify(salas));
}

function carregarTarefas() {
  try {
    return JSON.parse(localStorage.getItem('lumi_tarefas')) || [];
  } catch {
    return [];
  }
}

function salvarTarefas(tarefas) {
  localStorage.setItem('lumi_tarefas', JSON.stringify(tarefas));
}

function chaveEstudante(userName) {
  return `salasEstudante_${userName}`;
}

function carregarSalasEstudante(userName) {
  try {
    return JSON.parse(localStorage.getItem(chaveEstudante(userName))) || [];
  } catch {
    return [];
  }
}

function salvarSalasEstudante(userName, codigos) {
  localStorage.setItem(chaveEstudante(userName), JSON.stringify(codigos));
}

export default function ClassroomsPage() {
  const navigate = useNavigate();

  const userType = localStorage.getItem('userType');
  const userName = localStorage.getItem('userName') || '';
  const isProfessor = userType === 'professor';

  const [salas, setSalas] = useState(carregarSalas);
  const [tarefas, setTarefas] = useState(carregarTarefas);
  const [salasEstudante, setSalasEstudante] = useState(() =>
    isProfessor ? [] : carregarSalasEstudante(userName)
  );

  const [nomeSala, setNomeSala] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salaSelecionada, setSalaSelecionada] = useState(null);

  const [mostrarAtividadesExistentes, setMostrarAtividadesExistentes] = useState(false);

  const tarefasConcluidas = useMemo(() => {
    if (isProfessor) return [];
    return JSON.parse(localStorage.getItem(`lumi_tarefas_concluidas_${userName}`) || '[]');
  }, [userName, isProfessor]);

  useEffect(() => {
    if (salaSelecionada && window.innerWidth <= 768) {
      const mainContent = document.querySelector('.classrooms-main');

      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [salaSelecionada]);

  const minhasSalas = isProfessor
    ? salas.filter((sala) => sala.criadoPor === userName)
    : [];

  const salasDoAluno = !isProfessor
    ? salas.filter((sala) => salasEstudante.includes(sala.codigo))
    : [];

  const listaSalas = isProfessor ? minhasSalas : salasDoAluno;

  const tarefasDaSala = salaSelecionada
    ? tarefas.filter((tarefa) => tarefa.salaId === salaSelecionada.id)
    : [];

  const atividadesExistentesDisponiveis = salaSelecionada
    ? tarefas.filter((tarefa) => {
        const criadaPeloProfessor = tarefa.criadoPor === userName;
        const naoEstaNestaSala = tarefa.salaId !== salaSelecionada.id;

        return criadaPeloProfessor && naoEstaNestaSala;
      })
    : [];

  const atualizarTarefas = (novasTarefas) => {
    salvarTarefas(novasTarefas);
    setTarefas(novasTarefas);
  };

  const handleCriarSala = (e) => {
    e.preventDefault();

    const nome = nomeSala.trim();

    if (!nome) {
      setErro('Informe um nome para a sala.');
      return;
    }

    const novaSala = {
      id: Date.now().toString(),
      nome,
      codigo: gerarCodigo(),
      criadoPor: userName,
    };

    const novasSalas = [...salas, novaSala];

    salvarSalas(novasSalas);
    setSalas(novasSalas);
    setSalaSelecionada(novaSala);
    setNomeSala('');
    setErro('');
    setSucesso(`Sala "${nome}" criada! Código: ${novaSala.codigo}`);

    setTimeout(() => setSucesso(''), 4000);
  };

  const handleEntrarComCodigo = (e) => {
    e.preventDefault();

    const codigo = codigoInput.trim();

    if (!codigo) {
      setErro('Informe o código da sala.');
      return;
    }

    const sala = salas.find((s) => s.codigo === codigo);

    if (!sala) {
      setErro('Código inválido. Verifique e tente novamente.');
      return;
    }

    if (salasEstudante.includes(codigo)) {
      setErro('Você já está nessa sala.');
      setSalaSelecionada(sala);
      return;
    }

    const novosCodigos = [...salasEstudante, codigo];

    salvarSalasEstudante(userName, novosCodigos);
    setSalasEstudante(novosCodigos);
    setSalaSelecionada(sala);
    setCodigoInput('');
    setErro('');
    setSucesso(`Você entrou na sala "${sala.nome}"!`);

    setTimeout(() => setSucesso(''), 4000);
  };

  const handleVincularAtividadeExistente = async (tarefaId) => {
    if (!salaSelecionada) return;

    const novasTarefas = tarefas.map((tarefa) => {
      if (String(tarefa.id) !== String(tarefaId)) return tarefa;

      return {
        ...tarefa,
        salaId: salaSelecionada.id,
        salaNome: salaSelecionada.nome,
        salaCodigo: salaSelecionada.codigo,
      };
    });

    atualizarTarefas(novasTarefas);
    setMostrarAtividadesExistentes(false);
    setSucesso('Atividade adicionada à sala com sucesso!');

    await showLumiNotification(
      'Nova atividade no LumiEduca! 🦊',
      `Uma atividade foi adicionada à sala ${salaSelecionada.nome}.`
    );

    setTimeout(() => setSucesso(''), 4000);
  };

  const handleRemoverAtividadeDaSala = (tarefaId) => {
    const novasTarefas = tarefas.map((tarefa) => {
      if (String(tarefa.id) !== String(tarefaId)) return tarefa;

      return {
        ...tarefa,
        salaId: null,
        salaNome: 'Geral',
        salaCodigo: null,
      };
    });

    atualizarTarefas(novasTarefas);
    setSucesso('Atividade removida desta sala.');
    setTimeout(() => setSucesso(''), 4000);
  };

  return (
    <div className="classrooms-shell page-wrapper">
      <div className="classrooms-page">
        <aside className="classrooms-sidebar">
          <h2 className="classrooms-sidebar-title">🏫 Salas de Aula</h2>

          {isProfessor ? (
            <form onSubmit={handleCriarSala} className="classrooms-sidebar-form">
              <input
                type="text"
                className="classrooms-input"
                placeholder="Nome da nova sala"
                value={nomeSala}
                onChange={(e) => {
                  setNomeSala(e.target.value);
                  setErro('');
                }}
                maxLength={60}
              />

              <button type="submit" className="classrooms-btn primary full">
                + Criar sala
              </button>
            </form>
          ) : (
            <form onSubmit={handleEntrarComCodigo} className="classrooms-sidebar-form">
              <input
                type="text"
                className="classrooms-input"
                placeholder="Código de 6 dígitos"
                value={codigoInput}
                onChange={(e) => {
                  setCodigoInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setErro('');
                }}
                maxLength={6}
              />

              <button type="submit" className="classrooms-btn primary full">
                Entrar na sala
              </button>
            </form>
          )}

          {erro && <p className="classrooms-error">{erro}</p>}
          {sucesso && <p className="classrooms-success">{sucesso}</p>}

          <div className="classrooms-sidebar-list">
            {listaSalas.length === 0 ? (
              <p className="classrooms-empty">
                {isProfessor ? 'Nenhuma sala criada.' : 'Nenhuma sala ainda.'}
              </p>
            ) : (
              listaSalas.map((sala) => (
                <button
                  key={sala.id}
                  type="button"
                  className={`classrooms-sidebar-item ${
                    salaSelecionada?.id === sala.id ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSalaSelecionada(sala);
                    setMostrarAtividadesExistentes(false);
                  }}
                >
                  <span className="classrooms-sidebar-item-name">{sala.nome}</span>

                  <span className="classrooms-sidebar-item-code">
                    {isProfessor ? sala.codigo : `Código: ${sala.codigo}`}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="classrooms-main">
          {salaSelecionada ? (
            <div className="classrooms-room">
              <div className="classrooms-room-header">
                <div>
                  <h1 className="classrooms-room-title">{salaSelecionada.nome}</h1>

                  <p className="classrooms-room-subtitle">
                    Código da sala: <strong>{salaSelecionada.codigo}</strong>
                  </p>
                </div>

                {isProfessor && (
                  <div className="classrooms-room-header-actions">
                    <button
                      type="button"
                      className="classrooms-btn primary"
                      onClick={() => navigate('/criar-tarefa')}
                    >
                      + Criar atividade
                    </button>

                    <button
                      type="button"
                      className="classrooms-btn secondary"
                      onClick={() => setMostrarAtividadesExistentes((prev) => !prev)}
                    >
                      {mostrarAtividadesExistentes
                        ? 'Fechar atividades'
                        : 'Adicionar atividade existente'}
                    </button>
                  </div>
                )}
              </div>

              {isProfessor && mostrarAtividadesExistentes && (
                <section className="classrooms-existing-panel">
                  <h2>Atividades já criadas</h2>

                  <p>
                    Escolha uma atividade da sua gestão para vincular à sala{' '}
                    <strong>{salaSelecionada.nome}</strong>.
                  </p>

                  {atividadesExistentesDisponiveis.length === 0 ? (
                    <p className="classrooms-empty">
                      Nenhuma atividade disponível para adicionar nesta sala.
                    </p>
                  ) : (
                    <div className="classrooms-existing-list">
                      {atividadesExistentesDisponiveis.map((tarefa) => (
                        <div key={tarefa.id} className="classrooms-existing-card">
                          <div>
                            <strong>{tarefa.nomeAtividade || tarefa.pergunta}</strong>
                            <p>{tarefa.pergunta}</p>
                            <small>Sala atual: {tarefa.salaNome || 'Geral'}</small>
                          </div>

                          <button
                            type="button"
                            className="classrooms-btn primary"
                            onClick={() => handleVincularAtividadeExistente(tarefa.id)}
                          >
                            Adicionar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <div className="classrooms-activities">
                {tarefasDaSala.length === 0 ? (
                  <p className="classrooms-empty">Nenhuma atividade vinculada ainda.</p>
                ) : (
                  tarefasDaSala.map((atv) => {
                    const estaPendente = !tarefasConcluidas.some(
                      (c) => String(c.idTarefa) === String(atv.id)
                    );

                    return (
                      <div
                        key={atv.id}
                        className={`classrooms-activity-card ${
                          !isProfessor && estaPendente ? 'clickable' : ''
                        }`}
                        onClick={() => {
                          if (!isProfessor && estaPendente) {
                            navigate('/tarefas-recebidas', {
                              state: { salaCodigo: salaSelecionada.codigo },
                            });
                          }
                        }}
                      >
                        <div className="classrooms-activity-header">
                          <span className="classrooms-activity-title">
                            {atv.nomeAtividade || atv.pergunta}
                          </span>

                          {!isProfessor && estaPendente && (
                            <span className="resolver-badge">▶️ Resolver</span>
                          )}

                          {!isProfessor && !estaPendente && (
                            <span className="concluido-status">✅ Concluído</span>
                          )}
                        </div>

                        <p className="classrooms-activity-desc">{atv.pergunta}</p>

                        {isProfessor && (
                          <div className="classrooms-activity-actions">
                            <button
                              type="button"
                              className="classrooms-btn secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/tarefas-recebidas');
                              }}
                            >
                              Revisar na gestão
                            </button>

                            <button
                              type="button"
                              className="classrooms-btn danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverAtividadeDaSala(atv.id);
                              }}
                            >
                              Remover da sala
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="classrooms-empty-state">
              <span className="classrooms-empty-icon">🏫</span>
              <p>Selecione uma sala na barra lateral para acessá-la.</p>
            </div>
          )}
        </main>
      </div>

      <footer className="app-footer student-footer">
        <div className="app-footer-content student-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}