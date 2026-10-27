import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Atividades (/api/v1/atividades e /salas/:id/atividades)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let atividadeId, salaId;

  const payloadAtividadeValida = {
    titulo: 'Prova de Algoritmos',
    materia: 'Computação',
    prazo: new Date(Date.now() + 86400000).toISOString(),
    questoes: [
      { enunciado: 'Questao 1', opcoes: ['Alternativa A', 'Alternativa B'], respostaCorreta: '1', ordem: 1 },
      { enunciado: 'Questao 2', opcoes: ['Alternativa A', 'Alternativa B'], respostaCorreta: '1', ordem: 2 }
    ]
  };

  beforeAll(async () => {
    await limparDados();

    const criarUser = async (tipo, sufixo) => {
      const hashCurto = Math.random().toString(36).substring(2, 7);
      const nomeUsuario = `${tipo.substring(0, 4)}_${sufixo}_${hashCurto}`;

      const res = await request(app)
        .post(`/api/v1/auth/register/${tipo}`)
        .send({ nome: `User ${sufixo}`, usuario: nomeUsuario, senha: 'password123' });
      
      if (res.status !== 201) {
        throw new Error(`Falha ao registrar ${tipo}: Status ${res.status} - Resposta: ${JSON.stringify(res.body)}`);
      }
      
      // Retorna APENAS o token com segurança
      return res.body.token;
    };

    tokenProfDono = await criarUser('professor', 'dono2');
    tokenProfOutro = await criarUser('professor', 'outro2');
    tokenAlunoDentro = await criarUser('aluno', 'dentro2');
    tokenAlunoFora = await criarUser('aluno', 'fora2');

    // Criação de sala e matrícula para os testes de vinculo
    const resSala = await request(app).post('/api/v1/salas').set('Authorization', `Bearer ${tokenProfDono}`).send({ nome: 'Sala Ativ' });
    salaId = resSala.body.id;
    await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ codigo: resSala.body.codigo });
  });
  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/atividades (Criação de Atividade)', () => {
    it('Deve criar atividade válida e retornar 201 mantendo respostaCorreta para o professor', async () => {
      const res = await request(app)
        .post('/api/v1/atividades')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send(payloadAtividadeValida);

      // Se der erro, printa a mensagem exata que a API retornou no terminal
      if (res.status !== 201) {
        throw new Error(`Erro ao criar atividade (${res.status}): ${JSON.stringify(res.body)}`);
      }

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.questoes[0]).toHaveProperty('respostaCorreta');
      atividadeId = res.body.id;
    });

    it('Deve bloquear alunos (403) e requisições sem token (401)', async () => {
      const resAluno = await request(app).post('/api/v1/atividades').set('Authorization', `Bearer ${tokenAlunoDentro}`).send(payloadAtividadeValida);
      expect(resAluno.status).toBe(403);

      const resNoToken = await request(app).post('/api/v1/atividades').send(payloadAtividadeValida);
      expect(resNoToken.status).toBe(401);
    });

    it('Deve retornar 400 para regras de validação estrutural de payload e questões', async () => {
      const req = request(app).post('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfDono}`);

      expect((await req.send({})).status).toBe(400); // Vazio
      expect((await req.send({ ...payloadAtividadeValida, titulo: 'A'.repeat(151) })).status).toBe(400); // Titulo 151 chars
      expect((await req.send({ ...payloadAtividadeValida, questoes: [] })).status).toBe(400); // Questoes vazio
      expect((await req.send({ ...payloadAtividadeValida, prazo: 'data-invalida' })).status).toBe(400); // Prazo invalido
      
      // Questão com 1 opção
      expect((await req.send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1'], respostaCorreta: '1', ordem: 1 }] })).status).toBe(400);
      
      // Questão com 7 opções
      expect((await req.send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1','2','3','4','5','6','7'], respostaCorreta: '1', ordem: 1 }] })).status).toBe(400);
      
      // Resposta correta fora do array de opções
      expect((await req.send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1', '2'], respostaCorreta: '5', ordem: 1 }] })).status).toBe(400);
    });
  });

  describe('GET /api/v1/atividades', () => {
    it('Professor dono vê suas atividades (com count), outro professor recebe array vazio', async () => {
      const resDono = await request(app).get('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resDono.status).toBe(200);
      expect(resDono.body.length).toBeGreaterThan(0);
      expect(resDono.body[0]._count).toHaveProperty('questoes');

      const resOutro = await request(app).get('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resOutro.status).toBe(200);
      expect(resOutro.body).toEqual([]);
    });
  });

  describe('POST /api/v1/salas/:id/atividades (Associação)', () => {
    it('Professor dono da sala vincula atividade com sucesso (201)', async () => {
      const res = await request(app)
        .post(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ idAtividade: atividadeId });
      expect(res.status).toBe(201);
    });

    it('Deve impedir duplo vínculo (409)', async () => {
      const res = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ idAtividade: atividadeId });
      expect(res.status).toBe(409);
    });

    it('Deve bloquear alunos (403), professor de fora (403) e validar payload', async () => {
      const resAluno = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ idAtividade: atividadeId });
      expect(resAluno.status).toBe(403);

      const resOutroProf = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfOutro}`).send({ idAtividade: atividadeId });
      expect(resOutroProf.status).toBe(403);
      expect(resOutroProf.body.erro).toBe('Apenas o professor dono pode alterar esta sala.');

      const resBodyErrado = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ atividadeId: { obj: true } });
      expect(resBodyErrado.status).toBe(400);

      const resAtividadeInex = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ atividadeId: '00000000-0000-0000-0000-000000000000' });
      expect([400, 404]).toContain(resAtividadeInex.status);
    });
  });

  describe('GET /api/v1/salas/:id/atividades (Visualização por Sala)', () => {
    it('Professor dono vê as atividades da sala com a respostaCorreta exposta', async () => {
      const res = await request(app).get(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(res.status).toBe(200);
      expect(res.body[0].questoes[0]).toHaveProperty('respostaCorreta');
    });

    it('Aluno matriculado vê as atividades mas a respostaCorreta é filtrada da API', async () => {
      const res = await request(app).get(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(200);
      expect(res.body[0].questoes[0]).not.toHaveProperty('respostaCorreta');
      expect(JSON.stringify(res.body)).not.toMatch(/respostaCorreta/);
    });

    it('Aluno e Professor de fora recebem 403', async () => {
      const resAluno = await request(app).get(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenAlunoFora}`);
      expect(resAluno.status).toBe(403);

      const resProf = await request(app).get(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resProf.status).toBe(403);
    });
  });

  describe('GET /api/v1/atividades/:id (Consulta Direta de Atividade)', () => {
    it('Dono recebe 200 (com resposta), matriculado recebe 200 (sem resposta)', async () => {
      const resDono = await request(app).get(`/api/v1/atividades/${atividadeId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resDono.status).toBe(200);
      expect(resDono.body.questoes[0]).toHaveProperty('respostaCorreta');

      const resMatriculado = await request(app).get(`/api/v1/atividades/${atividadeId}`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(resMatriculado.status).toBe(200);
      expect(resMatriculado.body.questoes[0]).not.toHaveProperty('respostaCorreta');
    });

    it('Id estranho (400) e Inexistente (404)', async () => {
      const resEstranho = await request(app).get(`/api/v1/atividades/abc.def`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resEstranho.status).toBe(400);

      const resInex = await request(app).get(`/api/v1/atividades/00000000-0000-0000-0000-000000000000`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resInex.status).toBe(404);
    });
  });
});