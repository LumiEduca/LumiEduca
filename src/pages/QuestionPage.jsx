import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/question.css';
import { bancoDeQuestoes } from '../data/questoes';
import '../styles/minigames.css';
import CompletarEquacao from '../components/minigames/CompletarEquacao';
import ConectarPares from '../components/minigames/ConectarPares';

export default function QuestionPage({ setPontos, concluidas, setConcluidas }) {
  const { materia } = useParams();
  const materiaBase = useMemo(() => materia.split('-')[0], [materia]);
  const navigate = useNavigate();
  const location = useLocation();

  const faseId = location.state?.faseId || 1;

  const questoesTotais = bancoDeQuestoes[materiaBase] || [];
  const questoes = useMemo(() => {
    return questoesTotais.filter((q) => String(q.fase) === String(faseId));
  }, [questoesTotais, faseId]);

  const [indice, setIndice] = useState(0);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [respostasCorrigidas, setRespostasCorrigidas] = useState({});
  const [erroMensagem, setErroMensagem] = useState('');
  const [faseFinalizada, setFaseFinalizada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  const questaoAtual = questoes[indice];

  const renderTextoComSublinhado = (texto) => {
    if (typeof texto !== 'string') return texto;

    const partes = texto.split(/_(.*?)_/);

    return partes.map((parte, index) => {
      if (index % 2 !== 0) {
        return (
          <span
            key={index}
            style={{
              textDecoration: 'underline',
              textDecorationThickness: '2px',
              fontWeight: 'bold',
            }}
          >
            {parte}
          </span>
        );
      }

      return parte;
    });
  };

  const progressoTexto = useMemo(() => {
    return `Questão ${indice + 1} de ${questoes.length}`;
  }, [indice, questoes.length]);

  if (!questaoAtual && !faseFinalizada) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Ops!</h2>
        <p>Não encontramos questões para a Fase {faseId} nesta matéria.</p>
        <button
          onClick={() => navigate(-1)}
          type="button"
          className="question-back-button"
        >
          Voltar
        </button>
      </div>
    );
  }

  const respostaSelecionada = questaoAtual
    ? respostasSelecionadas[questaoAtual.id] ?? null
    : null;

  const correcaoAtual = questaoAtual
    ? respostasCorrigidas[questaoAtual.id] ?? null
    : null;

  const ultimaQuestao = indice === questoes.length - 1;

  const verificarResposta = (questao, respostaUsuario) => {
    if (questao.tipo === 'conectar-pares') {
      return JSON.stringify(respostaUsuario) === JSON.stringify(questao.correta);
    }

    return String(respostaUsuario) === String(questao.correta);
  };

  const corrigirQuestao = (questao, respostaUsuario) => {
    const acertou = verificarResposta(questao, respostaUsuario);

    setRespostasSelecionadas((prev) => ({
      ...prev,
      [questao.id]: respostaUsuario,
    }));

    setRespostasCorrigidas((prev) => ({
      ...prev,
      [questao.id]: {
        acertou,
        respostaUsuario,
        mensagem: acertou
          ? questao.explicacaoCorreta || 'Muito bem! Você acertou!'
          : questao.explicacaoErrada || `Quase! A resposta correta era ${questao.correta}.`,
      },
    }));

    setErroMensagem('');
  };

  const handleSelecionarOpcao = (opcao) => {
    if (correcaoAtual) return;
    corrigirQuestao(questaoAtual, opcao);
  };

  const handleVoltar = () => {
    navigate(`/trilha/${materiaBase}`);
  };

  const finalizarQuestionario = () => {
    let ganhouNaSessao = 0;
    let totalAcertos = 0;
    const novasConcluidas = [...concluidas];

    const resumoQuestoes = questoes.map((questao) => {
      const respostaUsuario = respostasSelecionadas[questao.id];
      const acertou = verificarResposta(questao, respostaUsuario);

      if (acertou) {
        totalAcertos += 1;

        const idUnico = `${materia}-${questao.id}`;

        if (!concluidas.includes(idUnico)) {
          ganhouNaSessao += 10;
          novasConcluidas.push(idUnico);
        }
      }

      return {
        id: questao.id,
        pergunta: questao.pergunta,
        respostaUsuario,
        respostaCorreta: questao.correta,
        acertou,
        explicacao: acertou
          ? questao.explicacaoCorreta || 'Resposta correta!'
          : questao.explicacaoErrada || `A resposta correta era ${questao.correta}.`,
      };
    });

    if (ganhouNaSessao > 0) {
      setPontos((prev) => prev + ganhouNaSessao);
    }

    setConcluidas([...new Set(novasConcluidas)]);

    const aprovado = totalAcertos >= 2;

    if (aprovado) {
      const progressoKey = `lumi_progresso_trilha_${materiaBase}`;
      const progressoAtual = JSON.parse(localStorage.getItem(progressoKey) || '{}');
      progressoAtual[`fase_${faseId}`] = true;
      localStorage.setItem(progressoKey, JSON.stringify(progressoAtual));
    }

    setResultadoFinal({
      totalAcertos,
      totalQuestoes: questoes.length,
      ganhouNaSessao,
      aprovado,
      resumoQuestoes,
    });

    setFaseFinalizada(true);
  };

  const handleAvancar = () => {
    if (!correcaoAtual) {
      setErroMensagem('Responda a questão antes de continuar.');
      return;
    }

    if (!ultimaQuestao) {
      setIndice((prev) => prev + 1);
      setErroMensagem('');
      return;
    }

    finalizarQuestionario();
  };

  const handleRefazer = () => {
    setIndice(0);
    setRespostasSelecionadas({});
    setRespostasCorrigidas({});
    setErroMensagem('');
    setFaseFinalizada(false);
    setResultadoFinal(null);
  };

  const handleContinuar = () => {
    navigate(`/trilha/${materiaBase}`);
  };

  const renderizarDesafio = () => {
    const handleResposta = (acertou, valor) => {
      if (correcaoAtual) return;
      corrigirQuestao(questaoAtual, valor);
    };

    switch (questaoAtual.tipo) {
      case 'completar-equacao':
      case 'completar-frase':
        return <CompletarEquacao questao={questaoAtual} onResponder={handleResposta} />;

      case 'conectar-pares':
        return <ConectarPares questao={questaoAtual} onResponder={handleResposta} />;

      default:
        return (
          <div className="question-options-grid">
            {questaoAtual.opcoes.map((opcao) => {
              const selecionada = respostaSelecionada === opcao;

              return (
                <button
                  key={opcao}
                  type="button"
                  disabled={!!correcaoAtual}
                  className={`question-option
                    ${selecionada ? 'selected' : ''}
                    ${
                      correcaoAtual && selecionada
                        ? correcaoAtual.acertou
                          ? 'answer-correct'
                          : 'answer-wrong'
                        : ''
                    }
                    ${correcaoAtual ? 'locked' : ''}`}
                  onClick={() => handleSelecionarOpcao(opcao)}
                >
                  {renderTextoComSublinhado(opcao)}
                </button>
              );
            })}
          </div>
        );
    }
  };

  if (faseFinalizada && resultadoFinal) {
    return (
      <div className="question-page page-wrapper">
        <main className="question-page-content">
          <section className="question-card question-result-card">
            <span className="question-badge">Resumo da fase</span>

            <h1 className="question-title">
              {resultadoFinal.aprovado
                ? 'Parabéns, pequeno explorador! 🦊'
                : 'Vamos tentar mais uma vez? 🦊'}
            </h1>

            <p className="question-instruction">
              Você acertou {resultadoFinal.totalAcertos} de{' '}
              {resultadoFinal.totalQuestoes} atividades e ganhou{' '}
              {resultadoFinal.ganhouNaSessao} pontos.
            </p>

            <div className="question-review-list">
              {resultadoFinal.resumoQuestoes.map((item, index) => (
                <div
                  key={item.id}
                  className={`question-review-item ${
                    item.acertou ? 'correct' : 'wrong'
                  }`}
                >
                  <strong>Atividade {index + 1}</strong>
                  <p>{item.explicacao}</p>
                </div>
              ))}
            </div>

            <div className="question-actions">
              {resultadoFinal.aprovado ? (
                <button
                  type="button"
                  className="question-next-button"
                  onClick={handleContinuar}
                >
                  Continuar para o próximo desafio ➜
                </button>
              ) : (
                <button
                  type="button"
                  className="question-next-button"
                  onClick={handleRefazer}
                >
                  Refazer seu desafio
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

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
            {['completar-equacao', 'completar-frase', 'conectar-pares'].includes(
              questaoAtual.tipo
            )
              ? 'Complete o desafio abaixo para poder avançar!'
              : 'Selecione a alternativa que você acredita estar correta.'}
          </p>

          <div className="question-minigame-wrapper">{renderizarDesafio()}</div>

          {correcaoAtual && (
            <div
              className={`question-feedback-box ${
                correcaoAtual.acertou ? 'correct' : 'wrong'
              }`}
            >
              <strong>{correcaoAtual.acertou ? 'Muito bem!' : 'Quase lá!'}</strong>
              <p>{correcaoAtual.mensagem}</p>
            </div>
          )}

          {erroMensagem && <p className="question-error-message">{erroMensagem}</p>}

          <div className="question-actions">
            <button
              type="button"
              className={`question-next-button ${!correcaoAtual ? 'disabled' : ''}`}
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