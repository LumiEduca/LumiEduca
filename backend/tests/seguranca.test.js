import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';
import app from '../app.js';

describe('Testes Globais de Segurança', () => {
  const originalEnv = process.env.NODE_ENV;
  const rotaLogin = '/api/v1/auth/login/aluno';

  beforeAll(async () => {
    await limparDados();
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
    process.env.NODE_ENV = originalEnv;
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
      .send({ usuario: { $gte: "" }, senha: "123" });
    
    expect(res.status).toBe(400);
  });

  it('Deve ocultar a stack trace de erro 500 quando NODE_ENV for production', async () => {
    process.env.NODE_ENV = 'production';
    
    // Importa diretamente o errorHandler e simula um erro não tratado com stack trace vazada
    const { errorHandler } = await import('../middlewares/errorHandler.js');
    
    const errMock = new Error('Database connection failed: password=secret_db_pass');
    errMock.status = 500;
    
    const reqMock = {};
    const resMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const nextMock = jest.fn();

    // Executa o errorHandler em ambiente de produção
    errorHandler(errMock, reqMock, resMock, nextMock);

    // Valida que o status foi 500 e que o corpo enviado ao cliente é puramente genérico
    expect(resMock.status).toHaveBeenCalledWith(500);
    expect(resMock.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
    
    // Garante que nenhum detalhe sensível ou stack trace vazou
    const respostaEnviada = resMock.json.mock.calls[0][0];
    expect(JSON.stringify(respostaEnviada)).not.toContain('secret_db_pass');
  });

  it('Deve restringir CORS para origens não cadastradas', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://site-hacker-malicioso.com');
    
    // Valida que o servidor não ecoa a origem maliciosa como permitida
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin === undefined || allowOrigin !== 'http://site-hacker-malicioso.com').toBe(true);
  });
});