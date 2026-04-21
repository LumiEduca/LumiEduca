import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/question.css';
import { bancoDeQuestoes } from '../data/questoes';

export default function QuestionPage({ setPontos, concluidas, setConcluidas }) {
  const { materia } = useParams();
  const navigate = useNavigate();

  const questoes = bancoDeQuestoes[materia] || [];

  const [indice, setIndice] = useState(0);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [erroMensagem, setErroMensagem] = useState('');

  const questaoAtual = questoes[indice];

  const progressoTexto = useMemo(() => {
    return `Questão ${indice + 1} de ${questoes.length}`;
  }, [indice, questoes.length]);

  if (!questaoAtual) return null;

  const respostaSelecionada = respostasSelecionadas[questaoAtual.id] ?? null;
  const ultimaQuestao = indice === questoes.length - 1;

  const handleSelecionarOpcao = (opcao) => {
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [questaoAtual.id]: opcao
    }));
    setErroMensagem('');
  };

  const handleVoltar = () => {
    navigate(`/trilha/${materia}`);
  };

  const finalizarQuestionario = () => {
    let ganhouNaSessao = 0;
    let errouAlguma = false;
    const novasConcluidas = [...concluidas];

    const resumoQuestoes = questoes.map((questao) => {
      const respostaUsuario = respostasSelecionadas[questao.id];
      const acertou = respostaUsuario === questao.correta;
      const idUnico = `${materia}-${questao.id}`;

      if (acertou) {
        if (!concluidas.includes(idUnico)) {
          ganhouNaSessao += 10;
          novasConcluidas.push(idUnico);
        }
      } else {
        errouAlguma = true;
      }

      return {
        id: questao.id,
        pergunta: questao.pergunta,
        respostaUsuario,
        respostaCorreta: questao.correta,
        acertou,
        explicacao: acertou
          ? (questao.explicacaoCorreta || 'Resposta correta!')
          : (questao.explicacaoErrada || `A resposta correta era ${questao.correta}.`)
      };
    });

    if (ganhouNaSessao > 0) {
      setPontos((prev) => prev + ganhouNaSessao);
    }

    setConcluidas([...new Set(novasConcluidas)]);

    if (materia === 'matematica') {
      const progressoKey = 'lumi_progresso_trilha_matematica';
      const progressoAtual = JSON.parse(localStorage.getItem(progressoKey) || '{}');

      if (!errouAlguma) {
        progressoAtual.fase_1 = true;
        localStorage.setItem(progressoKey, JSON.stringify(progressoAtual));
      }
    }

    navigate('/vitoria', {
      state: {
        ganhos: ganhouNaSessao,
        errouAlguma,
        materia,
        resumoQuestoes
      }
    });
  };

  const handleAvancar = () => {
    if (respostaSelecionada === null || respostaSelecionada === undefined) {
      setErroMensagem('Selecione uma alternativa antes de continuar.');
      return;
    }

    if (!ultimaQuestao) {
      setIndice((prev) => prev + 1);
      setErroMensagem('');
      return;
    }

    finalizarQuestionario();
  };

  return (
    <div className="question-page page-wrapper">
      <main className="question-page-content">
        <button
          type="button"
          className="question-back-button"
          onClick={handleVoltar}
        >
          ← Voltar para a trilha
        </button>

        <section className="question-card">
          <div className="question-top">
            <span className="question-badge">Fase de {materia}</span>
            <span className="question-progress">{progressoTexto}</span>
          </div>

          <h1 className="question-title">{questaoAtual.pergunta}</h1>

          <p className="question-instruction">
            Selecione a alternativa que você acredita estar correta e avance para continuar.
          </p>

          <div className="question-options-grid">
            {questaoAtual.opcoes.map((opcao) => {
              const isSelected = respostaSelecionada === opcao;

              return (
                <button
                  key={opcao}
                  type="button"
                  className={`question-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelecionarOpcao(opcao)}
                >
                  {opcao}
                </button>
              );
            })}
          </div>

          {erroMensagem && (
            <p className="question-error-message">{erroMensagem}</p>
          )}

          <div className="question-actions">
            <button
              type="button"
              className={`question-next-button ${
                respostaSelecionada === null || respostaSelecionada === undefined
                  ? 'disabled'
                  : ''
              }`}
              onClick={handleAvancar}
            >
              {ultimaQuestao ? 'Finalizar fase 🏁' : 'Próxima pergunta ➜'}
            </button>
          </div>
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