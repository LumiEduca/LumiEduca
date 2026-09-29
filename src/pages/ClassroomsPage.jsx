import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/classrooms.css';
import { showLumiNotification } from '../services/notificationClient';
import * as salasService from '../services/salasService';
import * as atividadesService from '../services/atividadesService';

export default function ClassroomsPage() {
  const navigate = useNavigate();

  const userType = localStorage.getItem('userType');
  const userName = localStorage.getItem('userName') || '';
  const isProfessor = userType === 'professor';

  const [salas, setSalas] = useState([]);
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [atividadesDaSala, setAtividadesDaSala] = useState([]);
  const [atividadesDoProfessor, setAtividadesDoProfessor] = useState([]);

  const [nomeSala, setNomeSala] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [mostrarAtividadesExistentes, setMostrarAtividadesExistentes] = useState(false);

  const tarefasConcluidas = useMemo(() => {
    if (isProfessor) return [];
    return JSON.parse(localStorage.getItem(`lumi_tarefas_concluidas_${userName}`) || '[]');
  }, [userName, isProfessor]);

  useEffect(() => {
    let ativo = true;

    salasService
      .listarSalas()
      .then(({ salas: listaSalas }) => {
        if (ativo) setSalas(listaSalas);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (salaSelecionada && window.innerWidth <= 768) {
      const mainContent = document.querySelector('.classrooms-main');

      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [salaSelecionada]);

  const carregarAtividadesDaSala = (salaId) => {
    salasService
      .listarAtividadesDaSala(salaId)
      .then(({ atividades }) => setAtividadesDaSala(atividades))
      .catch((e) => setErro(e.message));
  };

  useEffect(() => {
    if (!salaSelecionada) {
      setAtividadesDaSala([]);
      return;
    }

    carregarAtividadesDaSala(salaSelecionada.id);
    setMostrarAtividadesExistentes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaSelecionada]);

  const idsNaSalaAtual = useMemo(
    () => new Set(atividadesDaSala.map((a) => String(a.id))),
    [atividadesDaSala]
  );

  const atividadesExistentesDisponiveis = atividadesDoProfessor.filter(
    (atividade) => !idsNaSalaAtual.has(String(atividade.id))
  );

  const handleCriarSala = async (e) => {
    e.preventDefault();

    const nome = nomeSala.trim();

    if (!nome) {
      setErro('Informe um nome para a sala.');
      return;
    }

    try {
      const { sala } = await salasService.criarSala(nome);

      setSalas((prev) => [sala, ...prev]);
      setSalaSelecionada(sala);
      setNomeSala('');
      setErro('');
      setSucesso(`Sala "${nome}" criada! Código: ${sala.codigo}`);

      setTimeout(() => setSucesso(''), 4000);
    } catch (erroCriar) {
      setErro(erroCriar.message);
    }
  };

  const handleEntrarComCodigo = async (e) => {
    e.preventDefault();

    const codigo = codigoInput.trim();

    if (!codigo) {
      setErro('Informe o código da sala.');
      return;
    }

    try {
      const { sala } = await salasService.entrarNaSala(codigo);

      setSalas((prev) => (prev.some((s) => s.id === sala.id) ? prev : [sala, ...prev]));
      setSalaSelecionada(sala);
      setCodigoInput('');
      setErro('');
      setSucesso(`Você entrou na sala "${sala.nome}"!`);

      setTimeout(() => setSucesso(''), 4000);
    } catch (erroEntrar) {
      setErro(erroEntrar.message);
    }
  };

  const handleAbrirAtividadesExistentes = () => {
    const abrir = !mostrarAtividadesExistentes;
    setMostrarAtividadesExistentes(abrir);

    if (abrir) {
      atividadesService
        .listarAtividades()
        .then(({ atividades }) => setAtividadesDoProfessor(atividades))
        .catch((e) => setErro(e.message));
    }
  };

  const handleVincularAtividadeExistente = async (atividadeId) => {
    if (!salaSelecionada) return;

    try {
      await salasService.vincularAtividade(salaSelecionada.id, atividadeId);
      carregarAtividadesDaSala(salaSelecionada.id);
      setMostrarAtividadesExistentes(false);
      setSucesso('Atividade adicionada à sala com sucesso!');

      await showLumiNotification(
        'Nova atividade no LumiEduca! 🦊',
        `Uma atividade foi adicionada à sala ${salaSelecionada.nome}.`
      );

      setTimeout(() => setSucesso(''), 4000);
    } catch (erroVincular) {
      setErro(erroVincular.message);
    }
  };

  const handleRemoverAtividadeDaSala = async (atividadeId) => {
    if (!salaSelecionada) return;

    try {
      await salasService.desvincularAtividade(salaSelecionada.id, atividadeId);
      carregarAtividadesDaSala(salaSelecionada.id);
      setSucesso('Atividade removida desta sala.');
      setTimeout(() => setSucesso(''), 4000);
    } catch (erroRemover) {
      setErro(erroRemover.message);
    }
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
            {carregando ? (
              <p className="classrooms-empty">Carregando salas...</p>
            ) : salas.length === 0 ? (
              <p className="classrooms-empty">
                {isProfessor ? 'Nenhuma sala criada.' : 'Nenhuma sala ainda.'}
              </p>
            ) : (
              salas.map((sala) => (
                <button
                  key={sala.id}
                  type="button"
                  className={`classrooms-sidebar-item ${
                    salaSelecionada?.id === sala.id ? 'active' : ''
                  }`}
                  onClick={() => setSalaSelecionada(sala)}
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
                      onClick={handleAbrirAtividadesExistentes}
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
                      {atividadesExistentesDisponiveis.map((atividade) => (
                        <div key={atividade.id} className="classrooms-existing-card">
                          <div>
                            <strong>{atividade.nome}</strong>
                            <p>{atividade.totalQuestoes} questão(ões)</p>
                          </div>

                          <button
                            type="button"
                            className="classrooms-btn primary"
                            onClick={() => handleVincularAtividadeExistente(atividade.id)}
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
                {atividadesDaSala.length === 0 ? (
                  <p className="classrooms-empty">Nenhuma atividade vinculada ainda.</p>
                ) : (
                  atividadesDaSala.map((atv) => {
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
                                salaId: salaSelecionada.id,
                                tarefaId: atv.id,
                                modoRevisao: !estaPendente,
                              },
                            });
                          }
                        }}
                      >
                        <div className="classrooms-activity-header">
                          <span className="classrooms-activity-title">{atv.nome}</span>

                          {!isProfessor && estaPendente && (
                            <span className="resolver-badge">▶️ Resolver</span>
                          )}

                          {!isProfessor && !estaPendente && (
                            <span className="concluido-status">✅ Concluído</span>
                          )}
                        </div>

                        <p className="classrooms-activity-desc">
                          {atv.totalQuestoes} questão(ões) • criado por {atv.criadoPor}
                        </p>

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
