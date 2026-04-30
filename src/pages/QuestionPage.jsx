import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/question.css';
import '../styles/minigames.css';
import { bancoDeQuestoes } from '../data/questoes';
import CompletarEquacao from '../components/minigames/CompletarEquacao';
import ConectarPares from '../components/minigames/ConectarPares';
import { pedirDicaAoLumi } from '../services/aiService';

const titulosFases = {
  matematica: {
    1: 'Fase 1 de Matemática: Soma Básica',
    2: 'Fase 2 de Matemática: Subtração',
    3: 'Fase 3 de Matemática: Multiplicação',
    4: 'Fase 4 de Matemática: Divisão',
  },
  portugues: {
    1: 'Fase 1 de Língua Portuguesa: Classes Gramaticais',
    2: 'Fase 2 de Língua Portuguesa: Ortografia',
    3: 'Fase 3 de Língua Portuguesa: Sinônimos e Antônimos',
    4: 'Fase 4 de Língua Portuguesa: Conectando Frases',
  },
};

export default function QuestionPage({ setPontos, concluidas, setConcluidas }) {
  const { materia } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const materiaBase = useMemo(() => materia.split('-')[0], [materia]);
  const faseId = location.state?.faseId || 1;

  const tituloFase =
    titulosFases[materiaBase]?.[faseId] || `Fase ${faseId} de ${materiaBase}`;

  const questoes = useMemo(() => {
    const questoesTotais = bancoDeQuestoes[materiaBase] || [];
    return questoesTotais.filter((q) => String(q.fase) === String(faseId));
  }, [materiaBase, faseId]);

  const [indice, setIndice] = useState(0);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [respostasCorrigidas, setRespostasCorrigidas] = useState({});
  const [erroMensagem, setErroMensagem] = useState('');
  const [faseFinalizada, setFaseFinalizada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  const [exibirDica, setExibirDica] = useState(false);
  const [textoDica, setTextoDica] = useState('');
  const [carregandoDica, setCarregandoDica] = useState(false);

  const questaoAtual = questoes[indice];
  const ultimaQuestao = indice === questoes.length - 1;

  const respostaSelecionada = questaoAtual
    ? respostasSelecionadas[questaoAtual.id] ?? null
    : null;

  const correcaoAtual = questaoAtual
    ? respostasCorrigidas[questaoAtual.id] ?? null
    : null;

  const progressoTexto = useMemo(() => {
    return `Questão ${indice + 1} de ${questoes.length}`;
  }, [indice, questoes.length]);

  const handleVoltar = () => {
    navigate(`/trilha/${materiaBase}`);
  };

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

  const formatarResposta = (resposta, questao) => {
    if (resposta === null || resposta === undefined) return 'Não respondida';

    if (questao?.tipo === 'conectar-pares' && typeof resposta === 'object') {
      return 'Pares conectados';
    }

    return resposta;
  };

  const formatarRespostaCorreta = (questao) => {
    if (questao.tipo === 'conectar-pares') {
      return Object.entries(questao.correta)
        .map(([parId, alvoId]) => {
          const par = questao.pares?.find((p) => p.id === parId);
          const alvo = questao.alvos?.find((a) => a.id === alvoId);

          return `${par?.display || parId} → ${alvo?.display || alvoId}`;
        })
        .join(' | ');
    }

    return questao.correta;
  };

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

  const handlePedirAjuda = async () => {
    if (!questaoAtual || carregandoDica) return;

    setCarregandoDica(true);
    setExibirDica(true);

    const opcoesContexto = questaoAtual.opcoes || [];
    const dica = await pedirDicaAoLumi(
      questaoAtual.pergunta,
      opcoesContexto,
      tituloFase
    );

    setTextoDica(dica);
    setCarregandoDica(false);
  };

  const finalizarQuestionario = useCallback(() => {
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
        tipo: questao.tipo,
        pares: questao.pares || [],
        alvos: questao.alvos || [],
        respostaUsuario,
        respostaCorreta: questao.correta,
        respostaCorretaFormatada: formatarRespostaCorreta(questao),
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
  }, [
    questoes,
    respostasSelecionadas,
    concluidas,
    materia,
    materiaBase,
    faseId,
    setPontos,
    setConcluidas,
  ]);

  const handleAvancar = () => {
    if (!correcaoAtual) {
      setErroMensagem('Responda a questão antes de continuar.');
      return;
    }

    if (!ultimaQuestao) {
      setIndice((prev) => prev + 1);
      setErroMensagem('');
      setExibirDica(false);
      setTextoDica('');
      setCarregandoDica(false);
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
    setExibirDica(false);
    setTextoDica('');
    setCarregandoDica(false);
  };

  const renderizarDesafio = () => {
    const handleRespostaMinigame = (_acertou, valor) => {
      if (correcaoAtual) return;
      corrigirQuestao(questaoAtual, valor);
    };

    switch (questaoAtual.tipo) {
      case 'completar-equacao':
      case 'completar-frase':
        return (
          <CompletarEquacao
            questao={questaoAtual}
            onResponder={handleRespostaMinigame}
          />
        );

      case 'conectar-pares':
        return (
          <ConectarPares
            questao={questaoAtual}
            onResponder={handleRespostaMinigame}
          />
        );

      default:
        return (
          <div className="question-options-grid">
            {questaoAtual.opcoes.map((opcao) => {
              const isSelecionada = respostaSelecionada === opcao;
              const isCorreta = String(opcao) === String(questaoAtual.correta);

              let statusClass = '';

              if (correcaoAtual && isSelecionada) {
                statusClass = correcaoAtual.acertou ? 'answer-correct' : 'answer-wrong';
              }

              if (correcaoAtual && !isSelecionada && isCorreta) {
                statusClass = 'answer-correct';
              }

              return (
                <button
                  key={opcao}
                  type="button"
                  disabled={!!correcaoAtual}
                  className={`question-option ${
                    isSelecionada ? 'selected' : ''
                  } ${statusClass} ${correcaoAtual ? 'locked' : ''}`}
                  onClick={() => {
                    if (!correcaoAtual) {
                      corrigirQuestao(questaoAtual, opcao);
                    }
                  }}
                >
                  {renderTextoComSublinhado(opcao)}
                </button>
              );
            })}
          </div>
        );
    }
  };

  if (!questaoAtual && !faseFinalizada) {
    return (
      <div className="question-page page-wrapper">
        <main className="question-page-content">
          <section className="question-card">
            <h1 className="question-title">Ops!</h1>
            <p className="question-instruction">
              Não encontramos questões para esta fase.
            </p>

            <div className="question-actions">
              <button
                type="button"
                className="question-next-button"
                onClick={handleVoltar}
              >
                Voltar para a trilha
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
              Você acertou <strong>{resultadoFinal.totalAcertos}</strong> de{' '}
              <strong>{resultadoFinal.totalQuestoes}</strong> atividades e ganhou{' '}
              <strong>{resultadoFinal.ganhouNaSessao}</strong> estrelas.
            </p>

            <div className="question-review-list">
              {resultadoFinal.resumoQuestoes.map((item, index) => (
                <div
                  key={item.id}
                  className={`question-review-item ${
                    item.acertou ? 'correct' : 'wrong'
                  }`}
                >
                  <strong>
                    Atividade {index + 1} — {item.acertou ? 'Acertou ✅' : 'Revise ❌'}
                  </strong>

                  <p className="review-question">{item.pergunta}</p>

                  <p>
                    <strong>Sua resposta:</strong>{' '}
                    {renderTextoComSublinhado(
                      String(formatarResposta(item.respostaUsuario, item))
                    )}
                  </p>

                  <p>
                    <strong>Gabarito:</strong>{' '}
                    {renderTextoComSublinhado(String(item.respostaCorretaFormatada))}
                  </p>

                  <p>{item.explicacao}</p>
                </div>
              ))}
            </div>

            <div className="question-actions">
              {resultadoFinal.aprovado ? (
                <button
                  type="button"
                  className="question-next-button"
                  onClick={() => navigate(`/trilha/${materiaBase}`)}
                >
                  Continuar ➜
                </button>
              ) : (
                <button
                  type="button"
                  className="question-next-button"
                  onClick={handleRefazer}
                >
                  Refazer desafio
                </button>
              )}
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

  return (
    <div className="question-page page-wrapper">
      <main className="question-page-content">
        <button type="button" className="question-back-button" onClick={handleVoltar}>
          ← Voltar para a trilha
        </button>

        <section className="question-card">
          <div className="question-top">
            <span className="question-badge">{tituloFase}</span>
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

          {exibirDica && (
            <div className={`lumi-hint-box ${carregandoDica ? 'loading' : ''}`}>
              <div className="lumi-hint-header">
                <span>🦊 Dica do Lumi</span>

                <button
                  type="button"
                  onClick={() => setExibirDica(false)}
                  className="close-hint"
                  aria-label="Fechar dica"
                >
                  ×
                </button>
              </div>

              <div className="lumi-hint-content">
                {carregandoDica ? (
                  <p className="typing-text">Pensando em uma dica...</p>
                ) : (
                  <p>{textoDica}</p>
                )}
              </div>
            </div>
          )}

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

          <div className="question-actions question-actions-with-hint">
            {!correcaoAtual && (
              <button
                type="button"
                className="question-hint-button"
                onClick={handlePedirAjuda}
                disabled={carregandoDica}
              >
                {carregandoDica ? 'Pensando...' : '🦊 Dica do Lumi'}
              </button>
            )}

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