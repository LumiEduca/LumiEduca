import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

// A variável precisa existir ANTES de o app ser carregado (import dinâmico)
process.env.FRONTEND_URL = 'http://localhost:3000';
const { default: app } = await import('../app.js');

describe('Testes Globais de Segurança', () => {
  const rotaLogin = '/api/v1/auth/login/aluno';

  beforeAll(async () => {
    await limparDados();
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('Não deve vazar senhaHash nas respostas de registro/usuário', async () => {
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Segurança', usuario: `seg_${hash}`, senha: 'password123' });

    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toMatch(/senhaHash/i);
  });

  it('Deve retornar 400 (Bad Request) para JSON malformado/quebrado', async () => {
    const res = await request(app)
      .post(rotaLogin)
      .set('Content-Type', 'application/json')
      .send('{"usuario": "teste", "senha": "123');

    expect(res.status).toBe(400);
  });

  it('Deve retornar 413 (Payload Too Large) para corpo maior que 100kb', async () => {
    const bigString = 'A'.repeat(105 * 1024);
    const res = await request(app)
      .post(rotaLogin)
      .send({ usuario: bigString, senha: '123' });

    expect(res.status).toBe(413);
  });

  it('Deve retornar 400 ao tentar NoSQL/Object Injection passando objeto no lugar de string', async () => {
    const res = await request(app)
      .post(rotaLogin)
      .send({ usuario: { $gte: '' }, senha: '123' });

    expect(res.status).toBe(400);
  });

  it('Deve ocultar a stack trace de erro 500 quando NODE_ENV for production', async () => {
    const { errorHandler } = await import('../middlewares/errorHandler.js');

    const envOriginal = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const errMock = new Error('Database connection failed: password=secret_db_pass');
      errMock.status = 500;

      const resMock = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      errorHandler(errMock, {}, resMock, jest.fn());

      expect(resMock.status).toHaveBeenCalledWith(500);
      expect(resMock.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });

      const respostaEnviada = resMock.json.mock.calls[0][0];
      expect(JSON.stringify(respostaEnviada)).not.toContain('secret_db_pass');
    } finally {
      // Restaura mesmo se algum expect falhar
      if (envOriginal === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = envOriginal;
      }
    }
  });

  describe('CORS', () => {
    it('Deve permitir a origem cadastrada em FRONTEND_URL', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('Não deve enviar access-control-allow-origin para origem não cadastrada', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'http://site-hacker-malicioso.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});