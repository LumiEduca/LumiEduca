import React, { useMemo, useState } from 'react';
import '../styles/classrooms.css';

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
  const userType = localStorage.getItem('userType');
  const userName = localStorage.getItem('userName') || '';
  const isProfessor = userType === 'professor';

  const [salas, setSalas] = useState(carregarSalas);
  const [salasEstudante, setSalasEstudante] = useState(() =>
    isProfessor ? [] : carregarSalasEstudante(userName)
  );

  const [nomeSala, setNomeSala] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salaSelecionada, setSalaSelecionada] = useState(null);
  const [mostrarAtividadesExistentes, setMostrarAtividadesExistentes] = useState(false);

  const tarefas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');

  const minhasSalas = isProfessor
    ? salas.filter((s) => s.criadoPor === userName)
    : [];

  const salasDoAluno = !isProfessor
    ? salas.filter((s) => salasEstudante.includes(s.codigo))
    : [];

  const listaSalas = isProfessor ? minhasSalas : salasDoAluno;

  const tarefasDaSala = salaSelecionada
    ? tarefas.filter((tarefa) => tarefa.salaId === salaSelecionada.id)
    : [];

  const tarefasDisponiveisParaAdicionar = useMemo(() => {
    if (!salaSelecionada) return [];

    return tarefas.filter((tarefa) => {
      const pertenceAoProfessor =
        tarefa.criadoPor === userName || tarefa.criadoPor === 'Professor';

      const naoEstaNaSala = tarefa.salaId !== salaSelecionada.id;

      return pertenceAoProfessor && naoEstaNaSala;
    });
  }, [tarefas, salaSelecionada, userName]);

  const atualizarTarefas = (novasTarefas) => {
    localStorage.setItem('lumi_tarefas', JSON.stringify(novasTarefas));
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

  const handleAdicionarAtividadeExistente = (atividadeId) => {
    if (!salaSelecionada) return;

    const novasTarefas = tarefas.map((tarefa) => {
      if (String(tarefa.id) !== String(atividadeId)) {
        return tarefa;
      }

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
    setTimeout(() => setSucesso(''), 4000);
  };

  return (
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
                className={`classrooms-sidebar-item ${
                  salaSelecionada?.id === sala.id ? 'active' : ''
                }`}
                onClick={() => {
                  setSalaSelecionada(sala);
                  setMostrarAtividadesExistentes(false);
                  setErro('');
                  setSucesso('');
                }}
              >
                <span className="classrooms-sidebar-item-name">{sala.nome}</span>
                <span className="classrooms-sidebar-item-code">{sala.codigo}</span>
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
                    className="classrooms-btn secondary"
                    onClick={() =>
                      setMostrarAtividadesExistentes((prev) => !prev)
                    }
                  >
                    {mostrarAtividadesExistentes
                      ? 'Fechar atividades existentes'
                      : '+ Adicionar atividade existente'}
                  </button>

                  <button
                    type="button"
                    className="classrooms-btn primary"
                    onClick={() => {
                      window.location.href = '/criar-tarefa';
                    }}
                  >
                    + Criar atividade para esta sala
                  </button>
                </div>
              )}
            </div>

            {isProfessor && mostrarAtividadesExistentes && (
              <section className="classrooms-existing-panel">
                <h2 className="classrooms-existing-title">
                  Atividades já criadas
                </h2>

                {tarefasDisponiveisParaAdicionar.length === 0 ? (
                  <p className="classrooms-empty">
                    Nenhuma atividade disponível para adicionar nesta sala.
                  </p>
                ) : (
                  <div className="classrooms-existing-list">
                    {tarefasDisponiveisParaAdicionar.map((atividade) => (
                      <div
                        key={atividade.id}
                        className="classrooms-existing-card"
                      >
                        <div>
                          <strong>
                            {atividade.nomeAtividade || atividade.pergunta}
                          </strong>

                          <p>
                            Sala atual:{' '}
                            <span>{atividade.salaNome || 'Geral'}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          className="classrooms-btn primary"
                          onClick={() =>
                            handleAdicionarAtividadeExistente(atividade.id)
                          }
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
                <p className="classrooms-empty">
                  {isProfessor
                    ? 'Nenhuma atividade vinculada a esta sala ainda.'
                    : 'Nenhuma atividade disponível nesta sala ainda.'}
                </p>
              ) : (
                tarefasDaSala.map((atv) => (
                  <div key={atv.id} className="classrooms-activity-card">
                    <div className="classrooms-activity-header">
                      <span className="classrooms-activity-title">
                        {atv.nomeAtividade || atv.pergunta}
                      </span>

                      <span className="classrooms-activity-date">
                        {atv.salaNome || salaSelecionada.nome}
                      </span>
                    </div>

                    <p className="classrooms-activity-desc">{atv.pergunta}</p>
                  </div>
                ))
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
  );
}
