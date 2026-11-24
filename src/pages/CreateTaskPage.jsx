import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import { showLumiNotification } from '../services/notificationClient';
import Modal from '../components/UI/Modal';
import { listarSalas } from '../services/salaService';
import { criarAtividade, editarAtividade } from '../services/atividadeService';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const tarefaEditando = location.state?.tarefa || null;

  const [nomeAtividade, setNomeAtividade] = useState(tarefaEditando?.nomeAtividade || '');
  const [materia, setMateria] = useState(tarefaEditando?.materia || '');
  const [prazo, setPrazo] = useState(() => {
    if (!tarefaEditando?.prazo) return '';
    const data = new Date(tarefaEditando.prazo);
    if (Number.isNaN(data.getTime())) return '';
    return new Date(data.getTime() - data.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [pergunta, setPergunta] = useState(tarefaEditando?.pergunta || '');
  const [opcoes, setOpcoes] = useState(
    tarefaEditando?.opcoes?.length ? tarefaEditando.opcoes : ['', '', '', '']
  );
  const [tipoQuestao, setTipoQuestao] = useState(
    tarefaEditando?.tipo === 'VERDADEIRO_FALSO' || tarefaEditando?.tipo === 'LACUNA'
      ? tarefaEditando.tipo
      : 'MULTIPLA_ESCOLHA'
  );
  const [correta, setCorreta] = useState(
    tarefaEditando?.tipo === 'VERDADEIRO_FALSO'
      ? tarefaEditando.respostaCorreta || 'Verdadeiro'
      : Number(tarefaEditando?.respostaCorreta ?? 0)
  );
  const [respostaLacuna, setRespostaLacuna] = useState(
    tarefaEditando?.tipo === 'LACUNA' ? tarefaEditando.respostaCorreta || '' : ''
  );
  const [salaSelecionada, setSalaSelecionada] = useState(tarefaEditando?.salaId || '');
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [salasProfessor, setSalasProfessor] = useState([]);

  useEffect(() => {
    listarSalas()
      .then((lista) => setSalasProfessor(lista))
      .catch(() => setSalasProfessor([]));
  }, []);

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpcaoChange = (index, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = valor;
    setOpcoes(novasOpcoes);
  };

  const salvarTarefa = async (e) => {
    e.preventDefault();
    if (salvando) return;

    if (!nomeAtividade.trim()) {
      setModal({
        isOpen: true,
        title: 'Nome da atividade obrigatório',
        message: 'Informe um nome para a atividade, como "Revisão Parte 1".',
        type: 'info',
      });
      return;
    }

    if (!pergunta.trim()) {
      setModal({
        isOpen: true,
        title: 'Pergunta obrigatória',
        message: 'Informe o enunciado da questão.',
        type: 'info',
      });
      return;
    }

    if (
      tipoQuestao === 'MULTIPLA_ESCOLHA' &&
      (opcoes.some((opt) => opt.trim() === '') || opcoes.length < 2)
    ) {
      setModal({
        isOpen: true,
        title: 'Alternativas incompletas',
        message: 'Preencha todas as alternativas antes de lançar o desafio.',
        type: 'info',
      });
      return;
    }

    if (tipoQuestao === 'LACUNA' && !respostaLacuna.trim()) {
      setModal({
        isOpen: true,
        title: 'Resposta obrigatória',
        message: 'Informe o texto que completa a lacuna.',
        type: 'info',
      });
      return;
    }

    if (!salaSelecionada) {
      setModal({
        isOpen: true,
        title: 'Escolha uma sala',
        message: 'Selecione a sala que vai receber este desafio.',
        type: 'info',
      });
      return;
    }

    const dados = {
      salaId: salaSelecionada,
      nomeAtividade: nomeAtividade.trim(),
      materia: materia.trim(),
      prazo: prazo ? new Date(prazo).toISOString() : null,
      tipo: tipoQuestao,
      pergunta: pergunta.trim(),
      opcoes:
        tipoQuestao === 'MULTIPLA_ESCOLHA'
          ? opcoes.map((opcao) => opcao.trim())
          : tipoQuestao === 'VERDADEIRO_FALSO'
            ? ['Verdadeiro', 'Falso']
            : [],
      respostaCorreta: tipoQuestao === 'LACUNA' ? respostaLacuna.trim() : correta,
    };

    setSalvando(true);
    try {
      if (tarefaEditando) {
        await editarAtividade(tarefaEditando.id, dados);
      } else {
        await criarAtividade(dados);
        await showLumiNotification(
          'Nova atividade no LumiEduca! 🦊',
          `${dados.nomeAtividade} foi lançada para os alunos.`
        );
      }
    } catch (err) {
      setSalvando(false);
      setModal({
        isOpen: true,
        title: 'Não foi possível salvar o desafio',
        message: err.message,
        type: 'info',
      });
      return;
    }

    setSalvando(false);
    navigate('/tarefas-recebidas');
  };

  return (
    <div className="professor-page">
      <main className="professor-page-content">
        <button
          type="button"
          className="professor-back-button"
          onClick={() => navigate('/tarefas-recebidas')}
        >
          ← Voltar para a gestão
        </button>

        <section className="professor-card blue-top">
          <span className="professor-badge">✨ Novo desafio personalizado</span>

          <h1 className="professor-title">
            {tarefaEditando ? 'Editar desafio' : 'Criar desafio'}
          </h1>

          <p className="professor-text">
            Monte uma atividade com a questão que melhor combina com o desafio.
          </p>

          <form className="professor-form-grid" onSubmit={salvarTarefa}>
            <div>
              <label className="professor-label">Nome da atividade</label>
              <input
                className="professor-input"
                type="text"
                placeholder="Ex: Revisão Parte 1"
                value={nomeAtividade}
                onChange={(e) => setNomeAtividade(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="professor-label">Matéria</label>
              <input
                className="professor-input"
                type="text"
                placeholder="Ex: Ciências"
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
              />
            </div>

            <div>
              <label className="professor-label">Prazo (opcional)</label>
              <input
                className="professor-input"
                type="datetime-local"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>

            <div>
              <label className="professor-label">Sala personalizada</label>
              <select
                className="professor-input"
                value={salaSelecionada}
                onChange={(e) => setSalaSelecionada(e.target.value)}
                required
              >
                <option value="">Selecione uma sala</option>
                {salasProfessor.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} — código {sala.codigo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="professor-label">Tipo de questão</label>
              <select
                className="professor-input"
                value={tipoQuestao}
                onChange={(e) => {
                  setTipoQuestao(e.target.value);
                  setCorreta(e.target.value === 'VERDADEIRO_FALSO' ? 'Verdadeiro' : 0);
                }}
              >
                <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                <option value="VERDADEIRO_FALSO">Verdadeiro ou falso</option>
                <option value="LACUNA">Preencher lacuna</option>
              </select>
            </div>

            <div>
              <label className="professor-label">Pergunta do desafio</label>
              <textarea
                className="professor-textarea"
                placeholder="Ex: Quanto é 5 + 5?"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                required
              />
            </div>

            {tipoQuestao === 'MULTIPLA_ESCOLHA' && (
              <div>
                <label className="professor-label">Alternativas (marque a correta)</label>

                <div className="professor-form-grid">
                  {opcoes.map((opcao, index) => (
                    <div key={index} className="professor-option-row">
                      <input
                        className="professor-radio"
                        type="radio"
                        name="correta"
                        checked={correta === index}
                        onChange={() => setCorreta(index)}
                      />

                      <input
                        className="professor-input"
                        type="text"
                        placeholder={`Opção ${index + 1}`}
                        value={opcao}
                        onChange={(e) => handleOpcaoChange(index, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tipoQuestao === 'VERDADEIRO_FALSO' && (
              <div>
                <label className="professor-label">Resposta correta</label>
                <select
                  className="professor-input"
                  value={correta}
                  onChange={(e) => setCorreta(e.target.value)}
                >
                  <option value="Verdadeiro">Verdadeiro</option>
                  <option value="Falso">Falso</option>
                </select>
              </div>
            )}

            {tipoQuestao === 'LACUNA' && (
              <div>
                <label className="professor-label">Resposta que completa a lacuna</label>
                <input
                  className="professor-input"
                  type="text"
                  placeholder="Resposta correta"
                  value={respostaLacuna}
                  onChange={(e) => setRespostaLacuna(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="professor-action-row">
              <button type="submit" className="professor-btn primary" disabled={salvando}>
                {salvando
                  ? 'Salvando...'
                  : tarefaEditando
                    ? 'Salvar alterações'
                    : 'Lançar para alunos'}
              </button>

              <button
                type="button"
                className="professor-btn secondary"
                onClick={() => navigate('/tarefas-recebidas')}
              >
                Cancelar
              </button>
            </div>
          </form>
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
        type={modal.type}
        onConfirm={closeModal}
      />
    </div>
  );
}
