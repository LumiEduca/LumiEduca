import API_BASE_URL from './apiConfig';

async function patch(caminho, corpo) {
  const jwt = localStorage.getItem('token');
  if (!jwt) {
    const e = new Error('Sessão expirada. Faça login novamente.');
    e.status = 401;
    throw e;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/auth${caminho}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const erro = new Error(data?.erro || 'Erro ao falar com o servidor.');
    erro.status = res.status;
    throw erro;
  }
  return data;
}

export const atualizarNome = (nome) => patch('/me', { nome });
export const trocarSenha = (senhaAtual, novaSenha) =>
  patch('/senha', { senhaAtual, novaSenha });