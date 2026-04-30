import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/question.css';
import { bancoDeQuestoes } from '../data/questoes';
import '../styles/minigames.css';
import CompletarEquacao from '../components/minigames/CompletarEquacao';
import ConectarPares from '../components/minigames/ConectarPares';
import { pedirDicaAoLumi } from '../services/aiService';

export default function QuestionPage({ setPontos, concluidas, setConcluidas }) {
  const { materia } = useParams();
  const materiaBase = useMemo(() => materia.split('-')[0], [materia]);
  const navigate = useNavigate();
  const location = useLocation();

  const faseId = location.state?.faseId || 1;

  // Corrigindo aviso de dependência do useMemo movendo o banco para dentro
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

  // Estados do Lumi
  const [exibirDica, setExibirDica] = useState(false);
  const [textoDica, setTextoDica] = useState('');
  const [carregandoDica, setCarregandoDica] = useState(false);

  const questaoAtual = questoes[indice];
  const ultimaQuestao = indice === questoes.length - 1;
  const respostaSelecionada = questaoAtual ? respostasSelecionadas[questaoAtual.id] ?? null : null;
  const correcaoAtual = questaoAtual ? respostasCorrigidas[questaoAtual.id] ?? null : null;

  const progressoTexto = useMemo(() => {
    return `Questão ${indice + 1} de ${questoes.length}`;
  }, [indice, questoes.length]);

  const handleVoltar = () => navigate(`/trilha/${materiaBase}`);

  const handlePedirAjuda = async () => {
    if (!questaoAtual) return;
    setCarregandoDica(true);
    setExibirDica(true);
    const opcoesContexto = questaoAtual.opcoes || [];
    const dica = await pedirDicaAoLumi(questaoAtual.pergunta, opcoesContexto, `Trilha: ${materiaBase}`);
    setTextoDica(dica);
    setCarregandoDica(false);
  };

  const verificarResposta = (questao, respostaUsuario) => {
    if (questao.tipo === 'conectar-pares') {
      return JSON.stringify(respostaUsuario) === JSON.stringify(questao.correta);
    }
    return String(respostaUsuario) === String(questao.correta);
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
        respostaUsuario,
        acertou,
        explicacao: acertou ? questao.explicacaoCorreta || 'Resposta correta!' : questao.explicacaoErrada || `A resposta correta era ${questao.correta}.`,
      };
    });

    if (ganhouNaSessao > 0) setPontos((prev) => prev + ganhouNaSessao);
    setConcluidas([...new Set(novasConcluidas)]);

    const aprovado = totalAcertos >= 2;
    if (aprovado) {
      const progressoKey = `lumi_progresso_trilha_${materiaBase}`;
      const progressoAtual = JSON.parse(localStorage.getItem(progressoKey) || '{}');
      progressoAtual[`fase_${faseId}`] = true;
      localStorage.setItem(progressoKey, JSON.stringify(progressoAtual));
    }

    setResultadoFinal({ totalAcertos, totalQuestoes: questoes.length, ganhouNaSessao, aprovado, resumoQuestoes });
    setFaseFinalizada(true);
  }, [questoes, respostasSelecionadas, concluidas, materia, materiaBase, faseId, setPontos, setConcluidas]);

  const handleAvancar = () => {
    if (!correcaoAtual) {
      setErroMensagem('Responda a questão antes de continuar.');
      return;
    }
    if (!ultimaQuestao) {
      setIndice((prev) => prev + 1);
      setErroMensagem('');
      setExibirDica(false);
      return;
    }
    finalizarQuestionario();
  };

  const corrigirQuestao = (questao, respostaUsuario) => {
    const acertou = verificarResposta(questao, respostaUsuario);
    setRespostasSelecionadas((prev) => ({ ...prev, [questao.id]: respostaUsuario }));
    setRespostasCorrigidas((prev) => ({
      ...prev,
      [questao.id]: {
        acertou,
        mensagem: acertou ? questao.explicacaoCorreta || 'Muito bem!' : questao.explicacaoErrada || `Quase! A resposta era ${questao.correta}.`,
      },
    }));
  };

  const renderTextoComSublinhado = (texto) => {
    if (typeof texto !== 'string') return texto;
    const partes = texto.split(/_(.*?)_/);
    return partes.map((parte, index) => index % 2 !== 0 ? <span key={index} style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{parte}</span> : parte);
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
            {questaoAtual.opcoes.map((opcao) => (
              <button
                key={opcao}
                type="button"
                disabled={!!correcaoAtual}
                className={`question-option ${respostaSelecionada === opcao ? 'selected' : ''} ${correcaoAtual && respostaSelecionada === opcao ? (correcaoAtual.acertou ? 'answer-correct' : 'answer-wrong') : ''} ${correcaoAtual ? 'locked' : ''}`}
                onClick={() => !correcaoAtual && corrigirQuestao(questaoAtual, opcao)}
              >
                {renderTextoComSublinhado(opcao)}
              </button>
            ))}
          </div>
        );
    }
  };

  if (faseFinalizada && resultadoFinal) {
    return (
      <div className="question-page page-wrapper">
        <main className="question-page-content">
          <section className="question-card question-result-card">
            <h1 className="question-title">{resultadoFinal.aprovado ? 'Parabéns! 🦊' : 'Tente de novo! 🦊'}</h1>
            <p className="question-instruction">Você acertou {resultadoFinal.totalAcertos} de {resultadoFinal.totalQuestoes}.</p>
            <div className="question-actions">
              <button className="question-next-button" onClick={() => navigate(`/trilha/${materiaBase}`)}>Continuar ➜</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="question-page page-wrapper">
      <main className="question-page-content">
        <button type="button" className="question-back-button" onClick={handleVoltar}>← Voltar</button>
        <section className="question-card">
          <div className="question-top">
            <span className="question-badge">Fase de {materia}</span>
            <span className="question-progress">{progressoTexto}</span>
          </div>
          <h1 className="question-title">{questaoAtual.pergunta}</h1>

          {exibirDica && (
            <div className={`lumi-hint-box ${carregandoDica ? 'loading' : ''}`}>
              <div className="lumi-hint-header">
                <span>🦊 Dica do Lumi</span>
                <button onClick={() => setExibirDica(false)} className="close-hint">×</button>
              </div>
              <div className="lumi-hint-content">{carregandoDica ? <p>Pensando...</p> : <p>{textoDica}</p>}</div>
            </div>
          )}

          <div className="question-minigame-wrapper">{renderizarDesafio()}</div>

          <div className="question-actions" style={{ gap: '1rem' }}>
            {!correcaoAtual && (
              <button type="button" className="question-back-button" onClick={handlePedirAjuda} disabled={carregandoDica} style={{ border: '2px solid #ff8c00', color: '#ff8c00' }}>
                {carregandoDica ? '...' : '🦊 Dica do Lumi'}
              </button>
            )}
            <button type="button" className={`question-next-button ${!correcaoAtual ? 'disabled' : ''}`} onClick={handleAvancar}>
              {ultimaQuestao ? 'Finalizar 🏁' : 'Próxima ➜'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}