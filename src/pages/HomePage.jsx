import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import lumiPointing from '../assets/images/lumi-icon-04.png';

export default function HomePage() {
  const navigate = useNavigate();

  const [pendentes, setPendentes] = useState(0);
  const [showProfessorTrail, setShowProfessorTrail] = useState(false);
  const [codigoSala, setCodigoSala] = useState('');

  const userType = localStorage.getItem('userType');

  useEffect(() => {
    const carregarPendentes = () => {
      const todas = JSON.parse(localStorage.getItem('lumi_tarefas') || '[]');
      const nomeUsuario = localStorage.getItem('userName') || 'visitante';

      const chaveConcluidas = `lumi_tarefas_concluidas_${nomeUsuario}`;
      const concluidas = JSON.parse(localStorage.getItem(chaveConcluidas) || '[]');

      if (userType === 'professor') {
        setPendentes(todas.length);
      } else {
        const listaPendentes = todas.filter(
          (t) => !concluidas.find((c) => c.idTarefa === t.id)
        );
        setPendentes(listaPendentes.length);
      }
    };

    carregarPendentes();
  }, [userType]);

  const handleOpenProfessorTrail = () => {
    setShowProfessorTrail((prev) => !prev);
  };

  return (
    <div className="student-home page-wrapper">
      <main className="student-home-content">
        {userType !== 'professor' && pendentes > 0 && (
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
            <div className="student-hero-badge">✨ Hora de explorar e aprender</div>

            <h1 className="student-title">Olá, pequeno explorador!</h1>

            <p className="student-subtitle">
              Qual caminho vamos seguir hoje?
            </p>

            <p className="student-description">
              Escolha sua próxima aventura no LumiEduca e siga aprendendo com
              interatividade, diversão e desafios feitos para você.
            </p>
          </div>

          <div className="student-hero-mascot">
            <img
              src={lumiPointing}
              alt="Mascote Lumi apontando para as opções de trilha"
              className="student-mascot-image"
            />
          </div>
        </section>

        <section className="student-trails-section">
          <div className="trail-card trail-card-primary">
            <div className="trail-card-content">
              <span className="trail-tag">Trilhas principais</span>

              <h2 className="trail-title">Trilha do Lumi</h2>

              <p className="trail-text">
                Explore os desafios padrão do LumiEduca e avance pelas atividades
                já disponíveis na plataforma.
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
                    <span>Desafio de soma</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="trail-subject-btn portuguese-btn disabled"
                  disabled
                >
                  <span className="trail-subject-icon">📚</span>
                  <div className="trail-subject-info">
                    <strong>Português</strong>
                    <span>Alfabeto em breve</span>
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

                  <button
                    type="button"
                    className="btn btn-primary custom-trail-submit"
                  >
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
      </main>

      <footer className="app-footer student-footer">
        <div className="app-footer-content student-footer-content">
          LumiEduca © 2026 • Aprender com tecnologia, diversão e propósito.
        </div>
      </footer>
    </div>
  );
}