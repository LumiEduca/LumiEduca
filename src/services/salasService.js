import request from './apiClient';

export function criarSala(nome) {
  return request('/salas', { method: 'POST', body: { nome } });
}

export function listarSalas() {
  return request('/salas');
}

export function entrarNaSala(codigo) {
  return request('/salas/entrar', { method: 'POST', body: { codigo } });
}

export function listarAtividadesDaSala(salaId) {
  return request(`/salas/${salaId}/atividades`);
}

export function vincularAtividade(salaId, atividadeId) {
  return request(`/salas/${salaId}/atividades`, {
    method: 'POST',
    body: { atividadeId },
  });
}

export function desvincularAtividade(salaId, atividadeId) {
  return request(`/salas/${salaId}/atividades/${atividadeId}`, {
    method: 'DELETE',
  });
}
