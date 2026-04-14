import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeacherReportPage() {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    setHistorico(JSON.parse(localStorage.getItem('lumi_historico_tarefas') || '[]'));
  }, []);

  return (
  <div style={containerStyle}>
    <h1 style={{ color: '#3498db', marginBottom: '30px' }}>Relatório de Atividades 📊</h1>
    
    {historico.length === 0 ? (
      <p>Nenhum registro encontrado.</p>
    ) : (
      /* O segredo está nesta DIV envolta da tabela */
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
              <th style={thStyle}>Aluno</th>
              <th style={thStyle}>Questão</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {historico.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{h.aluno}</td>
                <td style={tdStyle}>{h.pergunta}</td>
                <td style={{ 
                  ...tdStyle, 
                  color: h.status.includes('✅') ? '#2ecc71' : '#e74c3c', 
                  fontWeight: 'bold' 
                }}>
                  {h.status}
                </td>
                <td style={tdStyle}>{h.data} - {h.hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    
    <button onClick={() => navigate('/')} style={btnVoltarStyle}>VOLTAR AO INÍCIO</button>
  </div>
);
}
const containerStyle = { 
  padding: '30px 20px', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  minHeight: '100vh', 
  backgroundColor: '#f9f9f9' 
};

const tableWrapperStyle = { 
  width: '100%', 
  maxWidth: '800px', 
  backgroundColor: 'white', 
  borderRadius: '20px', 
  overflowX: 'auto',        // PERMITE SCROLL LATERAL NO MOBILE
  WebkitOverflowScrolling: 'touch', 
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  marginBottom: '20px'
};

const tableStyle = { 
  width: '100%', 
  minWidth: '600px',        // FORÇA LARGURA MÍNIMA PARA O SCROLL FUNCIONAR
  borderCollapse: 'collapse' 
};

const thStyle = { 
  padding: '15px', 
  textAlign: 'left', 
  backgroundColor: '#3498db', 
  color: 'white',
  whiteSpace: 'nowrap' 
};

const tdStyle = { 
  padding: '15px', 
  borderBottom: '1px solid #eee',
  whiteSpace: 'nowrap' 
};

const btnVoltarStyle = { 
  marginTop: '30px', 
  padding: '12px 25px', 
  backgroundColor: '#888', 
  color: 'white', 
  border: 'none', 
  borderRadius: '12px', 
  fontWeight: 'bold', 
  cursor: 'pointer' 
};