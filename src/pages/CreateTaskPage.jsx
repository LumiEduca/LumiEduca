import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';
import { showLumiNotification } from '../services/notificationClient';
import Modal from '../components/UI/Modal';

export default function CreateTaskPage() {
  const navigate = useNavigate();

  const [nomeAtividade, setNomeAtividade] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [opcoes, setOpcoes] = useState(['', '', '', '']);
  const [correta, setCorreta] = useState(0);
  const [salaSelecionada, setSalaSelecionada] = useState('');
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const userName = localStorage.getItem('userName') || 'Professor';

  const salasProfessor = useMemo(() => {
    const salas = JSON.parse(localStorage.getItem('salas') || '[]');
    return salas.filter((sala) => sala.criadoPor === userName);
  }, [userName]);

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

    if (!nomeAtividade.trim()) {
      setModal({
        isOpen: true,
        title: 'Nome da atividade obrigatório',
        message: 'Informe um nome para a atividade, como "Revisão Parte 1".',
        type: 'info',
      });
      return;
    }

    if (opcoes.some((opt) => opt.trim() === '')) {
      setModal({
        isOpen: true,
        title: 'Alternativas incompletas',
        message: 'Preencha todas as alternativas antes de lançar o desafio.',
        type: 'info',
      });
      return;
    }

    const tarefasAtuais = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
    const sala = salasProfessor.find((s) => s.id === salaSelecionada);

    const novaTarefa = {
      id: Date.now(),
      nomeAtividade: nomeAtividade.trim(),
      pergunta,
      opcoes,
      respostaCorreta: correta,
      tipo: 'multipla_escolha',
      criadoPor: userName,
      salaId: sala?.id || null,
      salaNome: sala?.nome || 'Geral',
      salaCodigo: sala?.codigo || null,
    };

    localStorage.setItem('lumi_tarefas', JSON.stringify([...tarefasAtuais, novaTarefa]));

    await showLumiNotification(
      'Nova atividade no LumiEduca! 🦊',
      `${novaTarefa.nomeAtividade} foi lançada para os alunos.`
    );

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

          <h1 className="professor-title">Criar desafio</h1>

          <p className="professor-text">
            Monte uma atividade de múltipla escolha e, se desejar, vincule a uma sala personalizada.
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
              <label className="professor-label">Sala personalizada</label>
              <select
                className="professor-input"
                value={salaSelecionada}
                onChange={(e) => setSalaSelecionada(e.target.value)}
              >
                <option value="">Geral — todos os alunos</option>
                {salasProfessor.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} — código {sala.codigo}
                  </option>
                ))}
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

            <div className="professor-action-row">
              <button type="submit" className="professor-btn primary">
                Lançar para alunos
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