import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import lumiPointing from '../assets/images/lumi-icon-04.png';
import lumiTeacher from '../assets/images/lumi-icon-01.png';

export default function HomePage() {
  const navigate = useNavigate();

  const [pendentes, setPendentes] = useState(0);
  const [showProfessorTrail, setShowProfessorTrail] = useState(false);
  const [codigoSala, setCodigoSala] = useState('');
  const [resumoProfessor, setResumoProfessor] = useState({
    tarefas: 0,
    historico: 0,
  });

  const userType = localStorage.getItem('userType');
  const isProfessor = userType === 'professor';

  useEffect(() => {
    const carregarDados = () => {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const historico = JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]');
      const nomeUsuario = localStorage.getItem('userName') || 'visitante';

      const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
      const concluidas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');

      if (isProfessor) {
        setPendentes(todas.length);
        setResumoProfessor({
          tarefas: todas.length,
          historico: historico.length,
        });
      } else {
        const listaPendentes = todas.filter(
          (t) => !concluidas.find((c) => c.idTarefa === t.id)
        );
        setPendentes(listaPendentes.length);
      }
    };

    carregarDados();
  }, [isProfessor]);

  const heroContent = useMemo(() => {
    if (isProfessor) {
      return {
        badge: '✨ Painel pedagógico do LumiEduca',
        title: 'Boas-vindas, educador!',
        subtitle: 'Vamos ajudar os pequenos a aprender mais hoje?',
        description:
          'Organize atividades, acompanhe resultados e conduza a jornada de aprendizagem com mais clareza e praticidade.',
        mascot: lumiTeacher,
        mascotAlt: 'Mascote Lumi em versão técnica para a área do professor',
      };
    }

    return {
      badge: '✨ Hora de explorar e aprender',
      title: 'Olá, pequeno explorador!',
      subtitle: 'Qual caminho vamos seguir hoje?',
      description:
        'Escolha sua próxima aventura no LumiEduca e siga aprendendo com interatividade, diversão e desafios feitos para você.',
      mascot: lumiPointing,
      mascotAlt: 'Mascote Lumi apontando para as opções de trilha',
    };
  }, [isProfessor]);

  const handleOpenProfessorTrail = () => {
    setShowProfessorTrail((prev) => !prev);
  };

  return (
    <div className={`student-home page-wrapper ${isProfessor ? 'professor-home' : ''}`}>
      <main className="student-home-content">
        {!isProfessor && pendentes > 0 && (
          <section className="pending-alert">
            <div className="pending-alert-text">
              <span className="pending-alert-icon">🔔</span>
              <p>
                <strong>{pendentes}</strong> desafio(s) esperando por você!
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary pending-alert-button"
              onClick={() => navigate('/tarefas-recebidas')}
            >
              Ver agora
            </button>
          </section>
        )}

        <section className="student-hero">
          <div className="student-hero-text">
            <div className="student-hero-badge">{heroContent.badge}</div>

            <h1 className="student-title">{heroContent.title}</h1>

            <p className="student-subtitle">{heroContent.subtitle}</p>

            <p className="student-description">{heroContent.description}</p>
          </div>

          <div className="student-hero-mascot">
            <img
              src={heroContent.mascot}
              alt={heroContent.mascotAlt}
              className={`student-mascot-image ${isProfessor ? 'teacher-mascot-image' : ''}`}
            />
          </div>
        </section>

        {!isProfessor ? (
          <section className="student-trails-section">
            <div className="trail-card trail-card-primary">
              <div className="trail-card-content">
                <span className="trail-tag">Trilhas principais</span>

                <h2 className="trail-title">Trilha do Lumi</h2>

                <p className="trail-text">
                  Explore os desafios padrão do LumiEduca e avance pelas atividades já
                  disponíveis na plataforma.
                </p>

                <div className="trail-actions-grid">
                  <button
                    type="button"
                    className="trail-subject-btn math-btn"
                    onClick={() => navigate('/trilha/matematica')}
                  >
                    <span className="trail-subject-icon">🔢</span>
                    <div className="trail-subject-info">
                      <strong>Matemática</strong>
                      <span>Desafios de soma</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="trail-subject-btn portuguese-btn"
                    onClick={() => navigate('/trilha/portugues')}
                  >
                    <span className="trail-subject-icon">📚</span>
                    <div className="trail-subject-info">
                      <strong>Português</strong>
                      <span>Explorar trilha</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="trail-card trail-card-secondary">
              <div className="trail-card-content">
                <span className="trail-tag secondary-tag">Atividades personalizadas</span>

                <h2 className="trail-title">Trilha do Professor</h2>

                <p className="trail-text">
                  Explore atividades personalizadas enviadas especialmente para sua
                  jornada de aprendizagem.
                </p>

                <button
                  type="button"
                  className="btn btn-secondary professor-trail-button"
                  onClick={handleOpenProfessorTrail}
                >
                  {showProfessorTrail ? 'Fechar acesso' : 'Explorar'}
                </button>

                {showProfessorTrail && (
                  <div className="custom-trail-panel">
                    <label htmlFor="codigoSala" className="custom-trail-label">
                      Digite o código da sala personalizada
                    </label>

                    <input
                      id="codigoSala"
                      type="text"
                      placeholder="Ex: SALA-LUMI-2026"
                      value={codigoSala}
                      onChange={(e) => setCodigoSala(e.target.value)}
                    />

                    <button type="button" className="btn btn-primary custom-trail-submit">
                      Explorar
                    </button>

                    <p className="custom-trail-note">
                      Em breve, esta opção permitirá acessar trilhas criadas pelo professor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="professor-dashboard">
            <div className="professor-summary-grid">
              <div className="professor-summary-card">
                <span className="professor-summary-label">Desafios cadastrados</span>
                <strong className="professor-summary-value">{resumoProfessor.tarefas}</strong>
                <p className="professor-summary-text">
                  Atividades prontas para revisão, edição e acompanhamento.
                </p>
              </div>

              <div className="professor-summary-card">
                <span className="professor-summary-label">Registros no relatório</span>
                <strong className="professor-summary-value">{resumoProfessor.historico}</strong>
                <p className="professor-summary-text">
                  Histórico recente dos envios e desempenhos dos alunos.
                </p>
              </div>
            </div>

            <div className="professor-resource-grid">
              <div className="professor-highlight-card">
                <span className="trail-tag secondary-tag">Gestão integrada</span>

                <h2 className="trail-title professor-card-title">Painel de gestão</h2>

                <p className="trail-text">
                  Controle seus desafios personalizados e acompanhe o desempenho
                  dos alunos com acesso rápido às principais ferramentas do professor.
                </p>

                <div className="professor-highlight-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/tarefas-recebidas')}
                  >
                    Abrir gestão de tarefas
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/relatorio-professor')}
                  >
                    Ver relatório
                  </button>
                </div>
              </div>

              <div className="trail-card trail-card-secondary professor-trail-card">
                <div className="trail-card-content">
                  <span className="trail-tag secondary-tag">Trilhas prontas</span>

                  <h2 className="trail-title professor-card-title">Trilha do Lumi</h2>

                  <p className="trail-text">
                    Use atividades prontas do LumiEduca durante a aula para aplicar
                    rapidamente conteúdos já organizados com os alunos.
                  </p>

                  <div className="trail-actions-grid">
                    <button
                      type="button"
                      className="trail-subject-btn math-btn"
                      onClick={() => navigate('/trilha/matematica')}
                    >
                      <span className="trail-subject-icon">🔢</span>
                      <div className="trail-subject-info">
                        <strong>Matemática</strong>
                        <span>Abrir fase pronta</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="trail-subject-btn portuguese-btn"
                      onClick={() => navigate('/trilha/portugues')}
                    >
                      <span className="trail-subject-icon">📚</span>
                      <div className="trail-subject-info">
                        <strong>Português</strong>
                        <span>Abrir fase pronta</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer student-footer">
        <div className="app-footer-content student-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}