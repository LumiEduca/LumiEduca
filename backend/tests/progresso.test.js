import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Progresso (/api/v1/progresso)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let salaId, atividadeId, questaoId, alunoDentroId, alunoForaId;

  beforeAll(async () => {
    await limparDados();

    const criarUser = async (tipo, sufixo) => {
      const hash = Math.random().toString(36).substring(2, 7);
      const res = await request(app)
        .post(`/api/v1/auth/register/${tipo}`)
        .send({ nome: `User ${sufixo}`, usuario: `${tipo.substring(0,4)}_${sufixo}_${hash}`, senha: 'password123' });
      
      // Se der erro de validação (ex: 400), ele vai printar exatamente o motivo
      if (res.status !== 201) {
        throw new Error(`Falha ao registrar ${tipo}: ${JSON.stringify(res.body)}`);
      }

      return { token: res.body.token, id: res.body.usuario.id };
    };

    const profDono = await criarUser('professor', 'dono');
    tokenProfDono = profDono.token;
    
    const profOutro = await criarUser('professor', 'outro');
    tokenProfOutro = profOutro.token;

    const alunoDentro = await criarUser('aluno', 'dentro');
    tokenAlunoDentro = alunoDentro.token;
    alunoDentroId = alunoDentro.id;

    const alunoFora = await criarUser('aluno', 'fora');
    tokenAlunoFora = alunoFora.token;
    alunoForaId = alunoFora.id;

    // Setup: Cria sala, aluno entra, cria atividade e vincula
    const resSala = await request(app).post('/api/v1/salas').set('Authorization', `Bearer ${tokenProfDono}`).send({ nome: 'Sala Progresso' });
    salaId = resSala.body.id;
    await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ codigo: resSala.body.codigo });

    const resAtiv = await request(app).post('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfDono}`).send({
      titulo: 'Atividade Teste', materia: 'Mat', prazo: new Date(Date.now() + 86400000).toISOString(),
      questoes: [{ enunciado: '2+2?', opcoes: ['3', '4'], respostaCorreta: '1', ordem: 1 }]
    });
    atividadeId = resAtiv.body.id;
    questaoId = resAtiv.body.questoes[0].id;

    await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ idAtividade: atividadeId });
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('POST /responder', () => {
    const responder = (token, body) => {
      const req = request(app).post('/api/v1/progresso/responder');
      if (token) req.set('Authorization', `Bearer ${token}`);
      return req.send(body);
    };
  
    it('Deve retornar 401 sem token', async () => {
      const res = await responder(null, { questaoId, resposta: '1' });
      expect(res.status).toBe(401);
    });
  
    it('Deve retornar 403 se um professor tentar responder', async () => {
      const res = await responder(tokenProfDono, { questaoId, resposta: '1' });
      expect(res.status).toBe(403);
    });
  
    it('Deve retornar 403 para aluno de fora da sala', async () => {
      const res = await responder(tokenAlunoFora, { questaoId, resposta: '1' });
      expect(res.status).toBe(403);
    });
  
    it('Deve retornar 404 para questão inexistente', async () => {
      const res = await responder(tokenAlunoDentro, {
        questaoId: '00000000-0000-0000-0000-000000000000',
        resposta: '1'
      });
      expect(res.status).toBe(404);
    });
  
    it('Deve retornar 400 para corpo vazio', async () => {
      const res = await responder(tokenAlunoDentro, {});
      expect(res.status).toBe(400);
    });
  
    it('Deve retornar 400 para questaoId como objeto', async () => {
      const res = await responder(tokenAlunoDentro, { questaoId: { obj: true }, resposta: '1' });
      expect(res.status).toBe(400);
    });
  
    it('Deve retornar 400 para resposta como objeto', async () => {
      const res = await responder(tokenAlunoDentro, { questaoId, resposta: { obj: true } });
      expect(res.status).toBe(400);
    });
  
    it('Aluno da sala deve responder corretamente recebendo 201, correta: true e pontosGanhos: 10', async () => {
      const res = await responder(tokenAlunoDentro, { questaoId, resposta: '1' });
      expect(res.status).toBe(201);
      expect(res.body.correta).toBe(true);
      expect(res.body.pontosGanhos).toBe(10);
    });
  
    it('Deve impedir que o aluno responda a mesma questão duas vezes (409)', async () => {
      const res = await responder(tokenAlunoDentro, { questaoId, resposta: '1' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /aluno/:id', () => {
    it('Aluno pode ver o próprio progresso (200) contendo totalPontos', async () => {
      const res = await request(app).get(`/api/v1/progresso/aluno/${alunoDentroId}`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPontos');
      expect(res.body.totalPontos).toBe(10);
    });

    it('Professor dono da sala pode ver o progresso do aluno (200)', async () => {
      const res = await request(app).get(`/api/v1/progresso/aluno/${alunoDentroId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPontos');
    });

    it('Outro aluno (403) e professor de fora (403) não podem ver o progresso', async () => {
      const resOutroAluno = await request(app).get(`/api/v1/progresso/aluno/${alunoDentroId}`).set('Authorization', `Bearer ${tokenAlunoFora}`);
      expect(resOutroAluno.status).toBe(403);

      const resProfFora = await request(app).get(`/api/v1/progresso/aluno/${alunoDentroId}`).set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resProfFora.status).toBe(403);
    });
  });

  describe('GET /trilha', () => {
    it('Aluno da sala consegue visualizar sua trilha (200)', async () => {
      const res = await request(app).get('/api/v1/progresso/trilha').set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(200);
    });

    it('Professores não possuem trilha e devem receber 403', async () => {
      const res = await request(app).get('/api/v1/progresso/trilha').set('Authorization', `Bearer ${tokenProfDono}`);
      expect(res.status).toBe(403);
    });
  });
});