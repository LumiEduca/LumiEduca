import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/learning-path.css';
import lumiMascot from '../assets/images/lumi-icon-02.png';




const DADOS_TRILHAS = {
  matematica: {
    nome: 'Matemática',
    cor: '#FF8C00',
    corSecundaria: '#FFF3E0',
    descricao: 'Avance pelas fases e desbloqueie novos desafios matemáticos.',
    mascoteTexto: 'Vamos resolver a próxima fase?',
    fases: [
      { id: 1, nome: 'Soma básica', path: '/exercicio/matematica' },
      { id: 2, nome: 'Subtração', path: '/exercicio/matematica-fase-2' },
      { id: 3, nome: 'Multiplicação', path: '/exercicio/matematica-fase-3' },
      { id: 4, nome: 'Divisão', path: '/exercicio/matematica-fase-4' }
    ]
  },
  portugues: {
    nome: 'Língua Portuguesa',
    cor: '#3498db',
    corSecundaria: '#EAF4FB',
    descricao: 'Siga pelas fases da nossa língua e fortaleça suas habilidades.',
    mascoteTexto: 'Vamos explorar as próximas palavras?',
    fases: [
      { id: 1, nome: 'Classes Gramaticais', path: '/exercicio/portugues' },
      { id: 2, nome: 'Ortografia', path: '/exercicio/portugues' },
      { id: 3, nome: 'Sinônimos e Antônimos', path: '/exercicio/portugues' },
      { id: 4, nome: 'Coesão e Conectivos', path: '/exercicio/portugues' }
    ]
  }
};

export default function LearningPathPage() {
  const { materia } = useParams();
  const navigate = useNavigate();
  const dados = DADOS_TRILHAS[materia];

  if (!dados) {
    return (
      <div className="learning-path-not-found">
        <h2>Trilha não encontrada!</h2>
        <button
          type="button"
          className="path-back-button"
          onClick={() => navigate('/')}
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const materiaBase = materia.split('-')[0]; 
  const progressoKey = `lumi_progresso_trilha_${materiaBase}`;
  const progressoSalvo = JSON.parse(localStorage.getItem(progressoKey) || '{}');

  const progresso = JSON.parse(localStorage.getItem(`lumi_progresso_trilha_${materiaBase}`) || '{}');

  console.log("Materia Base:", materiaBase);
  console.log("Objeto de Progresso lido:", progresso);

  const fasesComStatus = dados.fases.map((fase) => {
    const concluida = !!progressoSalvo[`fase_${fase.id}`];

    if (concluida) {
      return { ...fase, status: 'completed' };
    }

    if (fase.id === 1) {
      return {
        ...fase,
        status: fase.path ? 'available' : 'locked'
      };
    }

    const faseAnteriorConcluida = !!progressoSalvo[`fase_${fase.id - 1}`];

    if (faseAnteriorConcluida && fase.path) {
      return { ...fase, status: 'available' };
    }

    return { ...fase, status: 'locked' };
  });

  const getNodeClassName = (status) => {
    if (status === 'completed') return 'path-node completed';
    if (status === 'available') return 'path-node available';
    return 'path-node locked';
  };

  return (
    <div className="learning-path-page page-wrapper">
      <main className="learning-path-content">
        <div className="learning-path-header">
          <button
            type="button"
            className="path-back-button"
            onClick={() => navigate('/')}
          >
            ← Voltar
          </button>

          <div
            className="learning-path-hero"
            style={{
              '--trail-color': dados.cor,
              '--trail-soft-color': dados.corSecundaria
            }}
          >
            <span className="trail-badge">✨ Trilha de fases</span>

            <h1 className="learning-path-title">Trilha de {dados.nome}</h1>

            <p className="learning-path-subtitle">{dados.descricao}</p>
          </div>
        </div>

        <section
          className="path-board modern-board"
          style={{
            '--trail-color': dados.cor,
            '--trail-soft-color': dados.corSecundaria
          }}
        >
          <svg
            className="path-dashed-lines"
            viewBox="0 0 1000 700"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* 1 -> 2 */}
            <path d="M235 105 C 380 120, 620 165, 760 185" />

            {/* 2 -> 3 */}
            <path d="M735 255 C 620 315, 430 305, 280 248" />

            {/* entrada em 3 */}
            <path d="M280 248 C 230 268, 205 300, 198 332" />

            {/* 3 -> curva inferior */}
            <path d="M198 332 C 198 420, 290 500, 405 525" />

            {/* curva inferior */}
            <path d="M405 525 C 560 535, 660 500, 700 486" />

            {/* final reto até a fase 4 */}
            <path d="M700 486 L 792 486" />
          </svg>

          <div className="path-mascot-placeholder">
          <div className="path-mascot-bubble">{dados.mascoteTexto}</div>
          <img
            src={lumiMascot}
            alt="Mascote Lumi guiando a trilha"
            className="path-mascot-image"
          />
          </div>

          <div className="path-list modern-path-list">
            {fasesComStatus.map((fase, index) => {
              const sideClass = index % 2 === 0 ? 'left' : 'right';

              const isClickable =
                (fase.status === 'available' || fase.status === 'completed') &&
                Boolean(fase.path);

              return (
                <div
                  key={fase.id}
                  className={`path-step ${sideClass} modern-step`}
                >
                  <div className="path-step-inner modern-step-inner">
                    <button
                      type="button"
                      className={getNodeClassName(fase.status)}
                      onClick={() => isClickable && navigate(fase.path, { state: { faseId: fase.id } })}
                      disabled={!isClickable}
                      aria-label={`Fase ${fase.id}: ${fase.nome}`}
                    >
                      <span className="path-node-number">{fase.id}</span>
                    </button>

                    <div className="path-step-info modern-step-info">
                      <strong>{fase.nome}</strong>
                      <span>
                        {fase.status === 'available' && 'Disponível agora'}
                        {fase.status === 'completed' && 'Concluída'}
                        {fase.status === 'locked' && 'Bloqueada'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="app-footer learning-path-footer">
        <div className="app-footer-content learning-path-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}