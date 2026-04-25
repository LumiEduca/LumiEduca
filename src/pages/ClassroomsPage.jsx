import React, { useState } from 'react';
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

  const [atividades, setAtividades] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('atividades')) || {};
    } catch {
      return {};
    }
  });
  const [mostrarFormAtividade, setMostrarFormAtividade] = useState(false);
  const [tituloAtividade, setTituloAtividade] = useState('');
  const [descricaoAtividade, setDescricaoAtividade] = useState('');
  const [erroAtividade, setErroAtividade] = useState('');

  const salvarAtividades = (novas) => {
    localStorage.setItem('atividades', JSON.stringify(novas));
    setAtividades(novas);
  };

  const handleAdicionarAtividade = (e) => {
    e.preventDefault();
    const titulo = tituloAtividade.trim();
    const descricao = descricaoAtividade.trim();
    if (!titulo) {
      setErroAtividade('Informe um título para a atividade.');
      return;
    }
    const salaId = salaSelecionada.id;
    const novaAtividade = {
      id: Date.now().toString(),
      titulo,
      descricao,
      criadaEm: new Date().toLocaleDateString('pt-BR'),
    };
    const novas = {
      ...atividades,
      [salaId]: [...(atividades[salaId] || []), novaAtividade],
    };
    salvarAtividades(novas);
    setTituloAtividade('');
    setDescricaoAtividade('');
    setErroAtividade('');
    setMostrarFormAtividade(false);
  };

  const minhasSalas = isProfessor
    ? salas.filter((s) => s.criadoPor === userName)
    : [];

  const salasDoEstudante = !isProfessor
    ? salas.filter((s) => salasEstudante.includes(s.codigo))
    : [];

  const listaSalas = isProfessor ? minhasSalas : salasDoEstudante;

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
      return;
    }

    const novosCodigos = [...salasEstudante, codigo];
    salvarSalasEstudante(userName, novosCodigos);
    setSalasEstudante(novosCodigos);
    setCodigoInput('');
    setErro('');
    setSucesso(`Você entrou na sala "${sala.nome}"!`);
    setTimeout(() => setSucesso(''), 4000);
  };

  return (
    <div className="classrooms-page">
      {/* Sidebar */}
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
                onClick={() => setSalaSelecionada(sala)}
              >
                <span className="classrooms-sidebar-item-name">{sala.nome}</span>
                {isProfessor && (
                  <span className="classrooms-sidebar-item-code">{sala.codigo}</span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="classrooms-main">
        {salaSelecionada ? (
          <div className="classrooms-room">
            <div className="classrooms-room-header">
              <h1 className="classrooms-room-title">{salaSelecionada.nome}</h1>
              <div className="classrooms-room-header-actions">
                {isProfessor && (
                  <span className="classrooms-room-code">
                    Código: <strong>{salaSelecionada.codigo}</strong>
                  </span>
                )}
                {isProfessor && (
                  <button
                    className="classrooms-btn primary"
                    onClick={() => {
                      setMostrarFormAtividade((v) => !v);
                      setErroAtividade('');
                    }}
                  >
                    {mostrarFormAtividade ? 'Cancelar' : '+ Adicionar Atividade'}
                  </button>
                )}
              </div>
            </div>

            {isProfessor && mostrarFormAtividade && (
              <form onSubmit={handleAdicionarAtividade} className="classrooms-activity-form">
                <input
                  type="text"
                  className="classrooms-input"
                  placeholder="Título da atividade"
                  value={tituloAtividade}
                  onChange={(e) => { setTituloAtividade(e.target.value); setErroAtividade(''); }}
                  maxLength={100}
                />
                <textarea
                  className="classrooms-input classrooms-textarea"
                  placeholder="Descrição"
                  value={descricaoAtividade}
                  onChange={(e) => setDescricaoAtividade(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                {erroAtividade && <p className="classrooms-error">{erroAtividade}</p>}
                <button type="submit" className="classrooms-btn primary">
                  Salvar atividade
                </button>
              </form>
            )}

            <div className="classrooms-activities">
              {(atividades[salaSelecionada.id] || []).length === 0 ? (
                <p className="classrooms-empty">Nenhuma atividade nesta sala ainda.</p>
              ) : (
                (atividades[salaSelecionada.id] || []).map((atv) => (
                  <div key={atv.id} className="classrooms-activity-card">
                    <div className="classrooms-activity-header">
                      <span className="classrooms-activity-title">{atv.titulo}</span>
                      <span className="classrooms-activity-date">{atv.criadaEm}</span>
                    </div>
                    {atv.descricao && (
                      <p className="classrooms-activity-desc">{atv.descricao}</p>
                    )}
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
