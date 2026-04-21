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
    return questoesTotais.filter(q => String(q.fase) === String(faseId));
  }, [questoesTotais, faseId]);

  const [indice, setIndice] = useState(0);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [erroMensagem, setErroMensagem] = useState('');

  const questaoAtual = questoes[indice];

  // Função para renderizar texto com marcação de sublinhado usando _palavra_
  const renderTextoComSublinhado = (texto) => {
    if (typeof texto !== 'string') return texto;
    // Regex busca o conteúdo entre sublinhados
    const partes = texto.split(/_(.*?)_/);
    
    return partes.map((parte, index) => {
      // Se o índice for ímpar, é a palavra que estava entre _ _
      if (index % 2 !== 0) {
        return (
          <span key={index} style={{ textDecoration: 'underline', textDecorationThickness: '2px', fontWeight: 'bold' }}>
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

  if (!questaoAtual) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Ops!</h2>
        <p>Não encontramos questões para a Fase {faseId} nesta matéria.</p>
        <button 
          onClick={() => navigate(-1)} 
          type="button"
          className="question-back-button">Voltar</button>
      </div>
    );
  }

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
    navigate(`/trilha/${materiaBase}`);
  };

  const finalizarQuestionario = () => {
    let ganhouNaSessao = 0;
    let errouAlguma = false;
    let totalErros = 0;
    const novasConcluidas = [...concluidas];

    const resumoQuestoes = questoes.map((questao) => {
      const respostaUsuario = respostasSelecionadas[questao.id];
      
      let acertou = false;
      if (questao.tipo === 'conectar-pares') {
        acertou = JSON.stringify(respostaUsuario) === JSON.stringify(questao.correta);
      } else {
        acertou = String(respostaUsuario) === String(questao.correta);
      }

      const idUnico = `${materia}-${questao.id}`;

      if (acertou) {
        if (!concluidas.includes(idUnico)) {
          ganhouNaSessao += 10;
          novasConcluidas.push(idUnico);
        }
      } else {
        errouAlguma = true;
        totalErros += 1;
      }

      return {
        id: questao.id,
        pergunta: questao.pergunta,
        pares: questao.pares || [],
        alvos: questao.alvos || [],
        respostaUsuario,
        respostaCorreta: questao.correta,
        acertou,
        explicacao: acertou
          ? (questao.explicacaoCorreta || 'Resposta correta!')
          : (questao.explicacaoErrada || `A resposta correta era ${questao.correta}.`)
      };
    });

    if (totalErros >= 2) {
      alert(`Ops! Você cometeu ${totalErros} erros. Vamos tentar novamente? 🦊`);
      navigate(`/trilha/${materiaBase}`);
      return;
    }

    if (ganhouNaSessao > 0) {
      setPontos((prev) => prev + ganhouNaSessao);
    }

    setConcluidas([...new Set(novasConcluidas)]);

    const progressoKey = `lumi_progresso_trilha_${materiaBase}`;
    const progressoAtual = JSON.parse(localStorage.getItem(progressoKey) || '{}');
    progressoAtual[`fase_${faseId}`] = true; 
    localStorage.setItem(progressoKey, JSON.stringify(progressoAtual));

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

  const renderizarDesafio = () => {
    const handleResposta = (acertou, valor) => {
      setRespostasSelecionadas(prev => ({
        ...prev,
        [questaoAtual.id]: valor
      }));
      setErroMensagem('');
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
                className={`question-option ${respostaSelecionada === opcao ? 'selected' : ''}`}
                onClick={() => handleSelecionarOpcao(opcao)}
              >
                {/* AQUI ESTÁ A MUDANÇA: Usamos a função auxiliar */}
                {renderTextoComSublinhado(opcao)}
              </button>
            ))}
          </div>
        );
    }
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
            {['completar-equacao', 'completar-frase', 'conectar-pares'].includes(questaoAtual.tipo)
            ? 'Complete o desafio abaixo para poder avançar!'
            : 'Selecione a alternativa que você acredita estar correta e avance.'}
          </p>

          <div className="question-minigame-wrapper">
            {renderizarDesafio()}
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