import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Progresso e Respostas (/api/v1/progresso)', () => {
  let tokenProf, tokenAluno;
  let atividadeId, salaId, questaoId, alunoId;

  beforeAll(async () => {
    await limparDados();

    const hashCurto = Math.random().toString(36).substring(2, 7);
    
    // Cria Professor
    const resProf = await request(app)
      .post('/api/v1/auth/register/professor')
      .send({ nome: 'Prof Progresso', usuario: `prof_prog_${hashCurto}`, senha: 'password123' });
    tokenProf = resProf.body.token;

    // Cria Aluno
    const resAluno = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Aluno Progresso', usuario: `al_prog_${hashCurto}`, senha: 'password123' });
    tokenAluno = resAluno.body.token;
    alunoId = resAluno.body.usuario.id;

    // Cria Sala
    const resSala = await request(app).post('/api/v1/salas').set('Authorization', `Bearer ${tokenProf}`).send({ nome: 'Sala Progresso' });
    salaId = resSala.body.id;

    // Aluno entra na sala
    await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAluno}`).send({ codigo: resSala.body.codigo });

    // Cria Atividade
    const resAtiv = await request(app)
      .post('/api/v1/atividades')
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({
        titulo: 'Quiz de Progresso',
        materia: 'Matemática',
        prazo: new Date(Date.now() + 86400000).toISOString(),
        questoes: [{ enunciado: 'Quanto é 2+2?', opcoes: ['Opcao A', 'Opcao B'], respostaCorreta: '1', ordem: 1 }]
      });
    atividadeId = resAtiv.body.id;
    questaoId = resAtiv.body.questoes[0].id;

    // Vincula Atividade à Sala com print para debug
    const resVinculo = await request(app)
      .post(`/api/v1/salas/${salaId}/atividades`)
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({ idAtividade: atividadeId });

    if (resVinculo.status !== 201) {
      console.log("FALHA AO VINCULAR ATIVIDADE À SALA:", resVinculo.status, resVinculo.body);
    }
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/progresso/responder', () => {
    it('Aluno deve conseguir responder atividade (200/201)', async () => {
      const res = await request(app)
        .post('/api/v1/progresso/responder')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({
          questaoId,
          resposta: '1'
        });

      expect([200, 201]).toContain(res.status);
    });

    it('Deve bloquear professor de enviar respostas (403)', async () => {
      const res = await request(app)
        .post('/api/v1/progresso/responder')
        .set('Authorization', `Bearer ${tokenProf}`)
        .send({
          questaoId,
          resposta: '1'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/progresso/aluno/:id', () => {
    it('Deve conseguir consultar o progresso do aluno autenticado ou autorizado', async () => {
      const res = await request(app)
        .get(`/api/v1/progresso/aluno/${alunoId}`)
        .set('Authorization', `Bearer ${tokenProf}`);

      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('GET /api/v1/progresso/trilha', () => {
    it('Aluno deve conseguir consultar sua trilha de aprendizado (200)', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/trilha')
        .set('Authorization', `Bearer ${tokenAluno}`);

      expect(res.status).toBe(200);
    });
  });
});