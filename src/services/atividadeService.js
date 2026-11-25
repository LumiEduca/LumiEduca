import API_BASE_URL from './apiConfig';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/desafios${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const padrao = {
      401: 'Sessão expirada. Entre novamente.',
      403: 'Você não tem permissão para esta ação.',
      404: 'Desafio não encontrado no servidor.',
    };
    throw new Error(
      data.erro || data.message || data.mensagem || padrao[res.status] || 'Erro ao falar com o servidor.'
    );
  }

  return data;
}

export const criarAtividade = (dados) =>
  request('', { method: 'POST', body: JSON.stringify(dados) });

export const editarAtividade = (id, dados) =>
  request(`/${id}`, { method: 'PATCH', body: JSON.stringify(dados) });

export const listarAtividades = (salaId) =>
  request(salaId ? `?salaId=${encodeURIComponent(salaId)}` : '');

// resposta: índice (múltipla escolha), "Verdadeiro"/"Falso" ou o texto da lacuna
export const responderAtividade = (id, resposta) =>
  request(`/${id}/responder`, { method: 'POST', body: JSON.stringify({ resposta }) });

export const excluirAtividade = (id) => request(`/${id}`, { method: 'DELETE' });
