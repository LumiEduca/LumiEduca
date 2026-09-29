import request from './apiClient';

export function criarAtividade(nome, questoes) {
  return request('/atividades', { method: 'POST', body: { nome, questoes } });
}

export function listarAtividades() {
  return request('/atividades');
}

export function obterAtividade(id) {
  return request(`/atividades/${id}`);
}
