import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Avaliações das demos (/api/v1/demos)', () => {
  let tokenProfessor = '';
  let tokenAluno = '';

  beforeAll(async () => {
    await limparDados();
    const sufixo = Date.now();

    const prof = await request(app)
      .post('/api/v1/auth/register/professor')
      .send({ nome: 'Prof Demo', usuario: `demo.prof.${sufixo}`, senha: 'password123' });
    tokenProfessor = prof.body.token;

    const aluno = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Aluno Demo', usuario: `demo.aluno.${sufixo}`, senha: 'password123' });
    tokenAluno = aluno.body.token;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('POST /avaliacoes', () => {
    it('Aceita avaliação sem login e retorna 201', async () => {
      const res = await request(app)
        .post('/api/v1/demos/avaliacoes')
        .send({ jogo: 'memoria', nota: 5 });

      expect(res.status).toBe(201);
      expect(res.body.avaliacao).toMatchObject({ jogo: 'memoria', nota: 5 });

      const noBanco = await prisma.avaliacaoDemo.findUnique({ where: { id: res.body.avaliacao.id } });
      expect(noBanco).not.toBeNull();
    });

    it.each([0, 6, 3.5, -1, '5', null])('Rejeita nota inválida (%p) com 400', async (nota) => {
      const res = await request(app)
        .post('/api/v1/demos/avaliacoes')
        .send({ jogo: 'quiz', nota });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('erro');
    });

    it('Rejeita jogo inexistente com 400', async () => {
      const res = await request(app)
        .post('/api/v1/demos/avaliacoes')
        .send({ jogo: 'jogo-fantasma', nota: 4 });
      expect(res.status).toBe(400);
    });

    it('Rejeita corpo vazio com 400', async () => {
      const res = await request(app).post('/api/v1/demos/avaliacoes').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /avaliacoes/resumo', () => {
    beforeAll(async () => {
      await prisma.avaliacaoDemo.deleteMany();
    });

    it('Retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/demos/avaliacoes/resumo');
      expect(res.status).toBe(401);
    });

    it('Retorna 403 para aluno', async () => {
      const res = await request(app)
        .get('/api/v1/demos/avaliacoes/resumo')
        .set('Authorization', `Bearer ${tokenAluno}`);
      expect(res.status).toBe(403);
    });

    it('Retorna resumo vazio quando não há avaliações', async () => {
      const res = await request(app)
        .get('/api/v1/demos/avaliacoes/resumo')
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ total: 0, media: null, jogos: [] });
    });

    it('Calcula total, média e distribuição por jogo', async () => {
      for (const [jogo, nota] of [['quiz', 5], ['quiz', 4], ['quiz', 3], ['memoria', 5]]) {
        const r = await request(app).post('/api/v1/demos/avaliacoes').send({ jogo, nota });
        expect(r.status).toBe(201);
      }

      const res = await request(app)
        .get('/api/v1/demos/avaliacoes/resumo')
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body.media).toBe(4.25);

      const quiz = res.body.jogos.find((j) => j.jogo === 'quiz');
      expect(quiz.total).toBe(3);
      expect(quiz.media).toBe(4);
      expect(quiz.distribuicao['5']).toBe(1);

      const memoria = res.body.jogos.find((j) => j.jogo === 'memoria');
      expect(memoria.media).toBe(5);
    });
  });
});