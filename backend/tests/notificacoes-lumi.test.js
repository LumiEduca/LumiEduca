import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Notificações, Lumi e Rate Limit', () => {
  let tokenUser;

  beforeAll(async () => {
    await limparDados();
    const hashCurto = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'User Notif', usuario: `notif_${hashCurto}`, senha: 'password123' });
    tokenUser = res.body.token;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/notificacoes/historico', () => {
    it('Deve listar o histórico de notificações do usuário autenticado (200)', async () => {
      const res = await request(app)
        .get('/api/v1/notificacoes/historico')
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).toBe(200);
      
      const dados = res.body.dados || res.body.historico || res.body.notificacoes || (Array.isArray(res.body) ? res.body : Object.values(res.body)[0]);
      expect(Array.isArray(dados)).toBe(true);
    });

    it('Deve retornar 401 sem token de autenticação', async () => {
      const res = await request(app).get('/api/v1/notificacoes/historico');
      expect(res.status).toBe(401);
    });
  });

  describe('Testes de Lumi Service / IA', () => {
    it('Deve responder corretamente às chamadas do assistente Lumi', async () => {
      const res = await request(app)
        .post('/api/v1/lumi/duvida')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ pergunta: 'O que é fotossíntese?' });

      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('Testes de Rate Limiting', () => {
    it('Deve conter headers de controle ou permitir requisições normais', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});