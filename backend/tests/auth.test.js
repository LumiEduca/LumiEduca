import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';
import jwt from 'jsonwebtoken';

describe('Testes de Autenticação (/api/v1/auth)', () => {
  beforeAll(async () => {
    await limparDados();
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  const professorBase = {
    nome: 'Prof Teste',
    usuario: `teste.prof.${Date.now()}`,
    senha: 'password123'
  };

  const alunoBase = {
    nome: 'Aluno Teste',
    usuario: `teste.aluno.${Date.now()}`,
    senha: 'password123'
  };

  let tokenProfessor = '';

  describe('POST /register', () => {
    it('Deve registrar um professor e retornar 201 com token e sem senhaHash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/professor')
        .send(professorBase);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      
      // Valida o usuário dentro do objeto retornado
      expect(res.body.usuario).toHaveProperty('usuario', professorBase.usuario);
      expect(res.body.usuario).not.toHaveProperty('senhaHash');
      
      tokenProfessor = res.body.token; // Salva para testes futuros
    });

    it('Deve retornar 409 ao tentar registrar usuário já existente', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/professor')
        .send(professorBase);

      expect(res.status).toBe(409);
      expect(res.body.erro).toBe('Esse usuário já está em uso');
    });

    it('Deve retornar 400 para senha com menos de 8 caracteres', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({ ...alunoBase, senha: 'short12' });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('A senha deve ter pelo menos 8 caracteres');
    });

    it('Deve forçar tipo ALUNO ao usar a rota /register/aluno, mesmo enviando tipo PROFESSOR', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({ ...alunoBase, tipo: 'PROFESSOR' });

      expect(res.status).toBe(201);
      const userNoBanco = await prisma.usuario.findUnique({ where: { usuario: alunoBase.usuario } });
      expect(userNoBanco.tipo).toBe('ALUNO');
    });
    
    it('Deve retornar 400 se o corpo estiver vazio ou com campos inválidos', async () => {
      const resVazio = await request(app).post('/api/v1/auth/register/aluno').send({});
      expect(resVazio.status).toBe(400);
      
      const resInvalido = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({ nome: { objeto: true }, usuario: 123, senha: [] });
      expect(resInvalido.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('Deve fazer login corretamente e não retornar senhaHash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login/professor')
        .send({ usuario: professorBase.usuario, senha: professorBase.senha });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario).not.toHaveProperty('senhaHash');
    });

    it('Deve retornar 401 unificado para usuário inexistente, senha errada ou tipo trocado', async () => {
      const msgEsperada = 'Usuário ou senha inválidos';
      
      const resInexistente = await request(app)
        .post('/api/v1/auth/login/professor')
        .send({ usuario: 'fantasma', senha: '123' });
      expect(resInexistente.status).toBe(401);
      expect(resInexistente.body.erro).toBe(msgEsperada);

      const resSenhaErrada = await request(app)
        .post('/api/v1/auth/login/professor')
        .send({ usuario: professorBase.usuario, senha: 'senha_errada_123' });
      expect(resSenhaErrada.status).toBe(401);
      expect(resSenhaErrada.body.erro).toBe(msgEsperada);

      const resTipoTrocado = await request(app)
        .post('/api/v1/auth/login/aluno') // Professor tentando logar na rota de aluno
        .send({ usuario: professorBase.usuario, senha: professorBase.senha });
      expect(resTipoTrocado.status).toBe(401);
      expect(resTipoTrocado.body.erro).toBe(msgEsperada);
    });
  });

  describe('GET /me e Validações de Token', () => {
    it('Deve retornar dados do usuário autenticado sem senhaHash', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.status).toBe(200);
      
      // Valida as propriedades dentro do objeto 'usuario' retornado
      expect(res.body.usuario).toHaveProperty('usuario', professorBase.usuario);
      expect(res.body.usuario).not.toHaveProperty('senhaHash');
    });

    it('Deve retornar 401 se não enviar token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('Token não fornecido');
    });

    it('Deve retornar 401 para token inválido, expirado ou assinado com outro segredo', async () => {
      const tokenInvalido = tokenProfessor.substring(0, tokenProfessor.length - 1) + 'a';
      const resInvalido = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenInvalido}`);
      expect(resInvalido.status).toBe(401);
      expect(resInvalido.body.erro).toBe('Token inválido ou expirado');

      const tokenOutroSegredo = jwt.sign({ id: '123', tipo: 'PROFESSOR' }, 'segredo_errado', { expiresIn: '1h' });
      const resOutro = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenOutroSegredo}`);
      expect(resOutro.status).toBe(401);
    });
  });

  describe('Testes Estruturais e de Segurança', () => {
    it('Deve retornar 404 e JSON estruturado para rota inexistente', async () => {
      const res = await request(app).get('/api/v1/auth/rota-fantasma');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ erro: 'Rota não encontrada' });
    });

    it('Deve conter cabeçalho x-content-type-options e ocultar x-powered-by', async () => {
      const res = await request(app).get('/api/v1/auth/rota-fantasma');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});