import request from './apiClient';

export function login(usuario, senha) {
  return request('/auth/login', {
    method: 'POST',
    body: { usuario, senha },
    auth: false,
  });
}

export function getMe() {
  return request('/auth/me');
}
