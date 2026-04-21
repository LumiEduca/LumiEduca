import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeacherReportPage() {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    setHistorico(JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]'));
  }, []);

  const resumo = useMemo(() => {
    const acertos = historico.filter((h) => h.status.includes('✅')).length;
    const erros = historico.filter((h) => h.status.includes('❌')).length;

    return {
      total: historico.length,
      acertos,
      erros,
    };
  }, [historico]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(255,140,0,0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(52,152,219,0.12), transparent 28%), #f5f7fb',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: '30px',
            padding: '28px',
            boxShadow: '0 18px 38px rgba(31,41,55,0.08)',
            borderTop: '6px solid #3498db',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#eaf4fb',
              color: '#2c80b9',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '16px',
            }}
          >
            📊 Acompanhamento pedagógico
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              color: '#1f2f4d',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.05,
            }}
          >
            Relatório de atividades
          </h1>

          <p
            style={{
              margin: '0 0 24px',
              color: '#66738a',
              lineHeight: 1.7,
              fontSize: '1rem',
            }}
          >
            Visualize rapidamente o histórico de respostas enviadas pelos alunos.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <ResumoCard titulo="Registros totais" valor={resumo.total} cor="#3498db" />
            <ResumoCard titulo="Acertos" valor={resumo.acertos} cor="#27ae60" />
            <ResumoCard titulo="Erros" valor={resumo.erros} cor="#e74c3c" />
          </div>

          {historico.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '28px',
                textAlign: 'center',
                color: '#66738a',
                boxShadow: '0 10px 24px rgba(31,41,55,0.06)',
              }}
            >
              Nenhum registro encontrado.
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
                borderRadius: '24px',
                boxShadow: '0 12px 24px rgba(31,41,55,0.08)',
                background: 'white',
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '760px',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ background: '#3498db', color: 'white' }}>
                    <th style={thStyle}>Usuário</th>
                    <th style={thStyle}>Atividade</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #edf1f5' }}>
                      <td style={tdStyle}>{h.aluno}</td>
                      <td style={tdStyle}>{h.pergunta}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color: h.status.includes('✅') ? '#27ae60' : '#e74c3c',
                          fontWeight: 800,
                        }}
                      >
                        {h.status}
                      </td>
                      <td style={tdStyle}>
                        {h.data} - {h.hora}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={primaryButtonStyle}>
              Voltar ao início
            </button>

            <button onClick={() => navigate('/tarefas-recebidas')} style={secondaryButtonStyle}>
              Abrir gestão de tarefas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor, cor }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '24px',
        padding: '18px',
        boxShadow: '0 10px 24px rgba(31,41,55,0.06)',
        borderTop: `5px solid ${cor}`,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          padding: '6px 10px',
          borderRadius: '999px',
          background: '#f4f8fb',
          color: '#2c80b9',
          fontWeight: 800,
          fontSize: '0.84rem',
        }}
      >
        {titulo}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: '14px',
          fontSize: '2.6rem',
          lineHeight: 1,
          color: '#1f2f4d',
        }}
      >
        {valor}
      </strong>
    </div>
  );
}

const thStyle = {
  padding: '15px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '15px',
  whiteSpace: 'nowrap',
  color: '#334155',
};

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '16px',
  padding: '14px 22px',
  background: '#3498db',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 6px 0 #2980b9',
};

const secondaryButtonStyle = {
  border: 'none',
  borderRadius: '16px',
  padding: '14px 22px',
  background: '#eef2f7',
  color: '#1f2f4d',
  fontWeight: 800,
  cursor: 'pointer',
};