import request from 'supertest';
import app from '../app.js';

describe('Testes de Autenticação', () => {
  it('Deve retornar erro 401 para credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login/professor')
      .send({
        usuario: 'usuario_falso',
        senha: 'senha_errada'
      });

    expect(response.status).toBe(401);
  });
});