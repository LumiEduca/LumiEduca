import API_BASE_URL from './apiConfig';

async function chamar(caminho, metodo = 'GET') {
  const jwt = localStorage.getItem('token');
  if (!jwt) throw new Error('sem-login');

  const res = await fetch(`${API_BASE_URL}/api/v1/notificacoes${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${jwt}` },
  });

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

export const listarNotificacoes = async () => (await chamar('/historico')).dados || [];
export const contarNaoLidas = async () => (await chamar('/nao-lidas/contagem')).total ?? 0;
export const marcarComoLida = (id) => chamar(`/${encodeURIComponent(id)}/lida`, 'PATCH');
export const marcarTodasComoLidas = () => chamar('/lidas', 'PATCH');