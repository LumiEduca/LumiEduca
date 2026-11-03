import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('POST /api/v1/auth/refresh', () => {
  let token;
  let usuarioId;

  beforeAll(async () => {
    await limparDados();
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/professor')
      .send({ nome: 'Prof Refresh', usuario: `prof_ref_${hash}`, senha: 'password123' });
    expect(res.status).toBe(201);
    token = res.body.token;
    usuarioId = res.body.usuario.id;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('401 sem token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('Token não fornecido');
  });

  it('200 devolve novo token, sem senhaHash, e o novo token funciona', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/senhaHash/);

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
  });

  it('mantém o início da sessão (authTime) ao renovar', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(jwt.decode(res.body.token).authTime).toBe(jwt.decode(token).authTime);
  });

  it('401 para token alterado', async () => {
    const alterado = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${alterado}`);
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('Token inválido ou expirado');
  });

  it('401 para token expirado', async () => {
    const expirado = jwt.sign(
      { id: usuarioId, tipo: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_SECRET
    );
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${expirado}`);
    expect(res.status).toBe(401);
  });

  it('401 quando a sessão tem mais de 7 dias', async () => {
    const velho = jwt.sign(
      { id: usuarioId, tipo: 'PROFESSOR', authTime: Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${velho}`);
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('Sessão expirada. Faça login novamente.');
  });

  it('401 quando o tipo do token não bate com o do banco', async () => {
    const falso = jwt.sign({ id: usuarioId, tipo: 'ALUNO' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).post('/api/v1/auth/refresh').set('Authorization', `Bearer ${falso}`);
    expect(res.status).toBe(401);
  });
});