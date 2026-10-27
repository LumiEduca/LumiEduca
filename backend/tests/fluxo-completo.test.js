import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Fluxo Completo E2E (Jornada Professor e Aluno)', () => {
  let tokenProf, tokenAluno;
  let salaId, codigoSala, atividadeId, questaoId, alunoId;

  beforeAll(async () => {
    await limparDados();
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('1. Deve registrar um Professor com sucesso (201)', async () => {
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/professor')
      .send({ nome: 'Prof E2E', usuario: `prof_e2e_${hash}`, senha: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    tokenProf = res.body.token;
  });

  it('2. Deve registrar um Aluno com sucesso (201)', async () => {
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Aluno E2E', usuario: `aluno_e2e_${hash}`, senha: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    tokenAluno = res.body.token;
    alunoId = res.body.usuario.id;
  });

  it('3. Professor deve conseguir criar uma Sala (201)', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({ nome: 'Sala E2E - Turma A' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.codigo).toBeDefined();
    salaId = res.body.id;
    codigoSala = res.body.codigo;
  });

  it('4. Aluno deve conseguir entrar na Sala usando o código (200)', async () => {
    const res = await request(app)
      .post('/api/v1/salas/entrar')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ codigo: codigoSala });

    // Status exato exigido pelo revisor
    expect(res.status).toBe(200);
  });

  it('5. Professor deve criar uma Atividade (201) e vinculá-la à Sala (201)', async () => {
    // Cria atividade
    const resAtiv = await request(app)
      .post('/api/v1/atividades')
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({
        titulo: 'Avaliação de Matemática E2E',
        materia: 'Matemática',
        prazo: new Date(Date.now() + 86400000).toISOString(),
        questoes: [
          { enunciado: 'Quanto é 5 x 5?', opcoes: ['20', '25', '30'], respostaCorreta: '1', ordem: 1 }
        ]
      });

    expect(resAtiv.status).toBe(201);
    atividadeId = resAtiv.body.id;
    questaoId = resAtiv.body.questoes[0].id;

    // Vincula à sala
    const resVinculo = await request(app)
      .post(`/api/v1/salas/${salaId}/atividades`)
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({ idAtividade: atividadeId });

    // Status exato exigido
    expect(resVinculo.status).toBe(201);
  });

  it('6. Aluno deve conseguir responder à questão da atividade com sucesso (201)', async () => {
    const res = await request(app)
      .post('/api/v1/progresso/responder')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({
        questaoId,
        resposta: '1'
      });

    // Status exato e validação de negócio básica
    expect(res.status).toBe(201);
    expect(res.body.correta).toBe(true);
  });

  it('7. Aluno deve conseguir consultar sua trilha de aprendizado (200)', async () => {
    const res = await request(app)
      .get('/api/v1/progresso/trilha')
      .set('Authorization', `Bearer ${tokenAluno}`);

    expect(res.status).toBe(200);
  });

  it('8. Professor deve conseguir consultar o progresso geral do aluno (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/progresso/aluno/${alunoId}`)
      .set('Authorization', `Bearer ${tokenProf}`);

    // Se é o professor da sala consultando o aluno da sala, TEM que ser 200. Sem espaço para 403 ou 404!
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPontos');
  });
});