import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/classrooms.css';
import { showLumiNotification } from '../services/notificationClient';
import SalaAlunosRanking from '../components/SalaAlunosRanking';
import {
  editarNomeSala,
  criarSala,
  listarSalas,
  entrarNaSala,
  detalharSala,
} from '../services/salaService';

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

// Guarda objetos { id, nome, codigo }; ignora o formato antigo (só códigos)
function carregarSalasEstudante(userName) {
  try {
    const lista = JSON.parse(localStorage.getItem(chaveEstudante(userName))) || [];
    return lista.filter((s) => s && typeof s === 'object' && s.id);
  } catch {
    return [];
  }
}

function salvarSalasEstudante(userName, salas) {
  localStorage.setItem(chaveEstudante(userName), JSON.stringify(salas));
}

export default function ClassroomsPage() {
  const navigate = useNavigate();

  const userType = localStorage.getItem('userType');
  const userName = localStorage.getItem('userName') || '';
  const isProfessor = userType === 'professor';

  const [salas, setSalas] = useState([]);
  const [tarefas, setTarefas] = useState(carregarTarefas);
  const [salasEstudante, setSalasEstudante] = useState(() =>
    isProfessor ? [] : carregarSalasEstudante(userName)
  );

  const [nomeSala, setNomeSala] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const [mostrarAtividadesExistentes, setMostrarAtividadesExistentes] = useState(false);

  const tarefasConcluidas = useMemo(() => {
    if (isProfessor) return [];
    return JSON.parse(localStorage.getItem(`lumi_tarefas_concluidas_${userName}`) || '[]');
  }, [userName, isProfessor]);

  // Carrega as salas da API ao abrir a página
  useEffect(() => {
    if (isProfessor) {
      listarSalas()
        .then((lista) => setSalas(lista))
        .catch((err) => setErro(err.message));
      return;
    }

    // Aluno: confirma no servidor quais salas ainda existem para ele
    Promise.all(
      carregarSalasEstudante(userName).map((s) =>
        detalharSala(s.id)
          .then((d) => ({ ...s, nome: d.nome }))
          .catch(() => null)
      )
    ).then((lista) => {
      const validas = lista.filter(Boolean);
      salvarSalasEstudante(userName, validas);
      setSalasEstudante(validas);
    });
  }, [isProfessor, userName]);

  useEffect(() => {
    if (salaSelecionada && window.innerWidth <= 768) {
      const mainContent = document.querySelector('.classrooms-main');

      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [salaSelecionada]);

  const listaSalas = isProfessor ? salas : salasEstudante;

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

  const handleCriarSala = async (e) => {
    e.preventDefault();

    const nome = nomeSala.trim();

    if (!nome) {
      setErro('Informe um nome para a sala.');
      return;
    }

    try {
      const novaSala = await criarSala(nome);

      setSalas([...salas, novaSala]);
      setSalaSelecionada(novaSala);
      setNomeSala('');
      setErro('');
      setSucesso(`Sala "${novaSala.nome}" criada! Código: ${novaSala.codigo}`);
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleEntrarComCodigo = async (e) => {
    e.preventDefault();

    const codigo = codigoInput.trim().toUpperCase();

    if (!codigo) {
      setErro('Informe o código da sala.');
      return;
    }

    try {
      const resp = await entrarNaSala(codigo);
      const sala = { id: resp.sala.id, nome: resp.sala.nome, codigo };

      const jaEstava = salasEstudante.some((s) => s.id === sala.id);
      const novas = jaEstava ? salasEstudante : [...salasEstudante, sala];

      salvarSalasEstudante(userName, novas);
      setSalasEstudante(novas);
      setSalaSelecionada(sala);
      setCodigoInput('');
      setErro('');
      setSucesso(`Você entrou na sala "${sala.nome}"!`);
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err.message);
    }
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

  const handleSalvarNome = async (e) => {
    e.preventDefault();

    const nome = novoNome.trim();
    if (!nome) {
      setErro('Informe um nome para a sala.');
      return;
    }

    try {
      await editarNomeSala(salaSelecionada.id, nome);

      const novasSalas = salas.map((s) =>
        s.id === salaSelecionada.id ? { ...s, nome } : s
      );
      setSalas(novasSalas);
      setSalaSelecionada({ ...salaSelecionada, nome });
      setEditandoNome(false);
      setErro('');
      setSucesso('Nome da sala atualizado!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleAlunoSaiu = (sala) => {
    const novas = salasEstudante.filter((s) => s.id !== sala.id);
    salvarSalasEstudante(userName, novas);
    setSalasEstudante(novas);
    setSalaSelecionada(null);
    setSucesso(`Você saiu da sala "${sala.nome}".`);
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
                    setEditandoNome(false);
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
                  {editandoNome ? (
                    <form onSubmit={handleSalvarNome} className="classrooms-title-edit">
                      <input
                        type="text"
                        className="classrooms-input"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        maxLength={60}
                        autoFocus
                      />
                      <button type="submit" className="classrooms-btn primary small">
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="classrooms-btn secondary small"
                        onClick={() => setEditandoNome(false)}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <h1 className="classrooms-room-title">{salaSelecionada.nome}</h1>
                  )}

                  <p className="classrooms-room-subtitle">
                    Código da sala: <strong>{salaSelecionada.codigo}</strong>
                  </p>
                </div>

                {isProfessor && (
                  <div className="classrooms-room-header-actions">
                    <button
                      type="button"
                      className="classrooms-btn secondary"
                      onClick={() => {
                        setNovoNome(salaSelecionada.nome);
                        setEditandoNome(true);
                      }}
                    >
                      ✏️ Editar nome
                    </button>

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

              <SalaAlunosRanking
                key={salaSelecionada.id}
                sala={salaSelecionada}
                isProfessor={isProfessor}
                onSaiu={handleAlunoSaiu}
              />

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
                          !isProfessor ? 'clickable' : ''
                        }`}
                        onClick={() => {
                          if (!isProfessor) {
                            navigate('/tarefas-recebidas', {
                              state: {
                                salaCodigo: salaSelecionada.codigo,
                                tarefaId: atv.id,
                                modoRevisao: !estaPendente,
                              },
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