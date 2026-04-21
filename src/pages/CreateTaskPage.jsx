import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/professor-pages.css';

export default function CreateTaskPage() {
  const [pergunta, setPergunta] = useState('');
  const [opcoes, setOpcoes] = useState(['', '', '', '']);
  const [correta, setCorreta] = useState(0);
  const navigate = useNavigate();

  const handleOpcaoChange = (index, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = valor;
    setOpcoes(novasOpcoes);
  };

  const salvarTarefa = (e) => {
    e.preventDefault();

    if (opcoes.some((opt) => opt.trim() === '')) {
      alert('Por favor, preencha todas as alternativas!');
      return;
    }

    const tarefasAtuais = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');

    const novaTarefa = {
      id: Date.now(),
      pergunta,
      opcoes,
      respostaCorreta: correta,
      tipo: 'multipla_escolha',
      criadoPor: 'Professor',
    };

    localStorage.setItem('lumi_tarefas', JSON.stringify([...tarefasAtuais, novaTarefa]));
    alert('Desafio de múltipla escolha lançado! 🚀');
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
            Monte uma atividade de múltipla escolha para enviar aos alunos com rapidez e organização.
          </p>

          <form className="professor-form-grid" onSubmit={salvarTarefa}>
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
    </div>
  );
}