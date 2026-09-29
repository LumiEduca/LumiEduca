import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import { showLumiNotification } from '../services/notificationClient';
import { criarAtividade } from '../services/atividadesService';
import Modal from '../components/UI/Modal';

function novaQuestaoEmBranco() {
  return {
    enunciado: '',
    opcoes: ['', '', '', ''],
    respostaCorreta: 0,
  };
}

export default function CreateTaskPage() {
  const navigate = useNavigate();

  const [nomeAtividade, setNomeAtividade] = useState('');
  const [questoes, setQuestoes] = useState([novaQuestaoEmBranco()]);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleEnunciadoChange = (indiceQuestao, valor) => {
    setQuestoes((prev) =>
      prev.map((q, i) => (i === indiceQuestao ? { ...q, enunciado: valor } : q))
    );
  };

  const handleOpcaoChange = (indiceQuestao, indiceOpcao, valor) => {
    setQuestoes((prev) =>
      prev.map((q, i) => {
        if (i !== indiceQuestao) return q;
        const novasOpcoes = [...q.opcoes];
        novasOpcoes[indiceOpcao] = valor;
        return { ...q, opcoes: novasOpcoes };
      })
    );
  };

  const handleCorretaChange = (indiceQuestao, indiceOpcao) => {
    setQuestoes((prev) =>
      prev.map((q, i) => (i === indiceQuestao ? { ...q, respostaCorreta: indiceOpcao } : q))
    );
  };

  const handleAdicionarQuestao = () => {
    setQuestoes((prev) => [...prev, novaQuestaoEmBranco()]);
  };

  const handleRemoverQuestao = (indiceQuestao) => {
    setQuestoes((prev) => prev.filter((_, i) => i !== indiceQuestao));
  };

  const salvarAtividade = async (e) => {
    e.preventDefault();

    if (!nomeAtividade.trim()) {
      setModal({
        isOpen: true,
        title: 'Nome da atividade obrigatório',
        message: 'Informe um nome para a atividade, como "Revisão Parte 1".',
        type: 'info',
      });
      return;
    }

    const questaoIncompleta = questoes.some(
      (q) => !q.enunciado.trim() || q.opcoes.some((opt) => opt.trim() === '')
    );

    if (questaoIncompleta) {
      setModal({
        isOpen: true,
        title: 'Questões incompletas',
        message: 'Preencha o enunciado e todas as alternativas de cada questão.',
        type: 'info',
      });
      return;
    }

    setSalvando(true);

    try {
      const { atividade } = await criarAtividade(nomeAtividade.trim(), questoes);

      await showLumiNotification(
        'Nova atividade no LumiEduca! 🦊',
        `${atividade.nome} foi criada e já pode ser vinculada a uma sala.`
      );

      navigate('/tarefas-recebidas');
    } catch (erro) {
      setModal({
        isOpen: true,
        title: 'Não foi possível criar a atividade',
        message: erro.message,
        type: 'info',
      });
    } finally {
      setSalvando(false);
    }
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

          <h1 className="professor-title">Criar desafio</h1>

          <p className="professor-text">
            Monte uma ou mais questões de múltipla escolha. Depois de criada, vincule a
            atividade a uma sala pela tela de Salas de Aula.
          </p>

          <form className="professor-form-grid" onSubmit={salvarAtividade}>
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

            {questoes.map((questao, indiceQuestao) => (
              <div key={indiceQuestao} className="professor-card">
                <div className="question-top">
                  <span className="professor-badge orange">
                    Questão {indiceQuestao + 1}
                  </span>

                  {questoes.length > 1 && (
                    <button
                      type="button"
                      className="professor-btn outline-danger"
                      onClick={() => handleRemoverQuestao(indiceQuestao)}
                    >
                      Remover questão
                    </button>
                  )}
                </div>

                <label className="professor-label">Pergunta</label>
                <textarea
                  className="professor-textarea"
                  placeholder="Ex: Quanto é 5 + 5?"
                  value={questao.enunciado}
                  onChange={(e) => handleEnunciadoChange(indiceQuestao, e.target.value)}
                  required
                />

                <label className="professor-label">Alternativas (marque a correta)</label>

                <div className="professor-form-grid">
                  {questao.opcoes.map((opcao, indiceOpcao) => (
                    <div key={indiceOpcao} className="professor-option-row">
                      <input
                        className="professor-radio"
                        type="radio"
                        name={`correta-${indiceQuestao}`}
                        checked={questao.respostaCorreta === indiceOpcao}
                        onChange={() => handleCorretaChange(indiceQuestao, indiceOpcao)}
                      />

                      <input
                        className="professor-input"
                        type="text"
                        placeholder={`Opção ${indiceOpcao + 1}`}
                        value={opcao}
                        onChange={(e) =>
                          handleOpcaoChange(indiceQuestao, indiceOpcao, e.target.value)
                        }
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="professor-action-row">
              <button
                type="button"
                className="professor-btn secondary"
                onClick={handleAdicionarQuestao}
              >
                + Adicionar questão
              </button>
            </div>

            <div className="professor-action-row">
              <button type="submit" className="professor-btn primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Criar atividade'}
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
