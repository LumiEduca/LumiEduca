import API_BASE_URL from './apiConfig';

// Se o login guardar o token com outra chave, troque só aqui.
function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/salas${path}`, {
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
      404: 'Sala não encontrada no servidor.',
    };
    throw new Error(
      data.erro || data.message || data.mensagem || padrao[res.status] || 'Erro ao falar com o servidor.'
    );
  }

  return data;
}

export const editarNomeSala = (salaId, nome) =>
  request(`/${salaId}`, { method: 'PATCH', body: JSON.stringify({ nome }) });

export const removerAlunoDaSala = (salaId, alunoId) =>
  request(`/${salaId}/alunos/${alunoId}`, { method: 'DELETE' });

export const sairDaSala = (salaId) =>
  request(`/${salaId}/sair`, { method: 'DELETE' });

export const buscarRankingDaSala = (salaId) => request(`/${salaId}/ranking`);