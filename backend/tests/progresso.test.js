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
      expect(res.body).not.toHaveProperty('respostaCorreta');
    });
  
    it('Deve impedir que o aluno responda a mesma questão duas vezes (409)', async () => {
      const res = await responder(tokenAlunoDentro, { questaoId, resposta: '1' });
      expect(res.status).toBe(409);
    });
  });

  describe('Conquistas automáticas', () => {
    let tokenAlunoConquistas;

    beforeAll(async () => {
      const sufixo = `conquistas_${Date.now()}`;

      const cadastro = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({
          nome: 'Aluno Conquistas',
          usuario: sufixo,
          senha: 'password123',
        });

      expect(cadastro.status).toBe(201);
      tokenAlunoConquistas = cadastro.body.token;

      const entrada = await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${tokenAlunoConquistas}`)
        .send({ codigo: codigoSala });

      expect(entrada.status).toBe(200);
    });

    async function criarAtividadeComQuestoes(quantidade) {
      const atividade = await request(app)
        .post('/api/v1/atividades')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({
          titulo: `Teste conquistas ${quantidade}`,
          materia: 'Matemática',
          questoes: Array.from({ length: quantidade }, (_, i) => ({
            enunciado: `Questão ${i + 1}`,
            opcoes: ['Errado', 'Correto'],
            respostaCorreta: '1',
            ordem: i + 1,
          })),
        });

      expect(atividade.status).toBe(201);

      const vinculada = await request(app)
        .post(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ idAtividade: atividade.body.id });

      expect(vinculada.status).toBe(201);

      return atividade.body.questoes;
    }

    async function responderQuestoes(questoes) {
      const respostas = [];

      for (const questao of questoes) {
        const resposta = await request(app)
          .post('/api/v1/progresso/responder')
          .set('Authorization', `Bearer ${tokenAlunoConquistas}`)
          .send({
            questaoId: questao.id,
            resposta: '1',
          });

        expect(resposta.status).toBe(201);
        respostas.push(resposta.body);
      }

      return respostas;
    }

    it('Concede a conquista da primeira atividade concluída', async () => {
      const questoes = await criarAtividadeComQuestoes(1);
      const respostas = await responderQuestoes(questoes);

      expect(respostas[0].atividade.concluida).toBe(true);
      expect(respostas[0].novasConquistas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            codigo: 'PRIMEIRA_ATIVIDADE',
          }),
        ])
      );
    });

    it('Concede a conquista de cinco acertos consecutivos', async () => {
      const questoes = await criarAtividadeComQuestoes(5);
      const respostas = await responderQuestoes(questoes);

      expect(
        respostas.some((resposta) =>
          resposta.novasConquistas?.some(
            (conquista) => conquista.codigo === 'CINCO_ACERTOS'
          )
        )
      ).toBe(true);
    });

    it('Concede a conquista ao acumular 100 pontos', async () => {
      const questoes = await criarAtividadeComQuestoes(10);
      const respostas = await responderQuestoes(questoes);

      expect(
        respostas.some((resposta) =>
          resposta.novasConquistas?.some(
            (conquista) => conquista.codigo === 'CEM_PONTOS'
          )
        )
      ).toBe(true);
    }, 60000);
  });

  describe('GET /conquistas', () => {
    it('Deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/v1/progresso/conquistas');

      expect(res.status).toBe(401);
    });

    it('Deve retornar 403 para professores', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/conquistas')
        .set('Authorization', `Bearer ${tokenProfDono}`);

      expect(res.status).toBe(403);
    });

    it('Deve retornar lista vazia para aluno sem conquistas', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/conquistas')
        .set('Authorization', `Bearer ${tokenAlunoFora}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.conquistas).toEqual([]);
    });

    it('Deve retornar as conquistas desbloqueadas pelo próprio aluno', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/conquistas')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.conquistas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            codigo: 'PRIMEIRA_ATIVIDADE',
            nome: 'Primeira conquista',
            descricao: 'Concluiu sua primeira atividade.',
            concedidaEm: expect.any(String),
          }),
        ])
      );
    });
  });  

  describe('GET /streak', () => {
    let alunoStreakId;
    let tokenAlunoStreak;
    let questoesStreak = [];

    beforeAll(async () => {
      const sufixo = `streak_${Date.now()}`;

      const cadastro = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({
          nome: 'Aluno Teste Streak',
          usuario: sufixo,
          senha: 'password123',
        });

      expect(cadastro.status).toBe(201);
      tokenAlunoStreak = cadastro.body.token;
      alunoStreakId = cadastro.body.usuario.id;

      const atividade = await request(app)
        .post('/api/v1/atividades')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({
          titulo: 'Atividade Teste Streak',
          materia: 'Matemática',
          questoes: Array.from({ length: 4 }, (_, i) => ({
            enunciado: `Questão Streak ${i + 1}`,
            opcoes: ['Errado', 'Correto'],
            respostaCorreta: '1',
            ordem: i + 1,
          })),
        });

      expect(atividade.status).toBe(201);

      questoesStreak = atividade.body.questoes;
    });

    async function criarRespostaStreak(indiceQuestao, diasAtras) {
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);

      await prisma.resposta.create({
        data: {
          alunoId: alunoStreakId,
          questaoId: questoesStreak[indiceQuestao].id,
          resposta: '1',
          correta: true,
          respondidaEm: data,
        },
      });
    }

    beforeEach(async () => {
      await prisma.resposta.deleteMany({
        where: { alunoId: alunoStreakId },
      });
    });

    it('Deve calcular três dias consecutivos de atividade', async () => {
      await criarRespostaStreak(0, 0);
      await criarRespostaStreak(1, 1);
      await criarRespostaStreak(2, 2);

      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoStreak}`);

      expect(res.status).toBe(200);
      expect(res.body.streakAtual).toBe(3);
      expect(res.body.melhorStreak).toBe(3);
    });

    it('Deve interromper a sequência quando faltar um dia', async () => {
      await criarRespostaStreak(0, 0);
      await criarRespostaStreak(1, 1);
      await criarRespostaStreak(2, 3);

      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoStreak}`);

      expect(res.status).toBe(200);
      expect(res.body.streakAtual).toBe(2);
      expect(res.body.melhorStreak).toBe(2);
    });

    it('Deve contar várias respostas no mesmo dia como apenas um dia', async () => {
      await criarRespostaStreak(0, 0);
      await criarRespostaStreak(1, 0);
      await criarRespostaStreak(2, 1);

      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoStreak}`);

      expect(res.status).toBe(200);
      expect(res.body.streakAtual).toBe(2);
      expect(res.body.melhorStreak).toBe(2);
    });

    it('Deve zerar o streak atual quando a última atividade foi há dois dias', async () => {
      await criarRespostaStreak(0, 2);
      await criarRespostaStreak(1, 3);

      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoStreak}`);

      expect(res.status).toBe(200);
      expect(res.body.streakAtual).toBe(0);
      expect(res.body.melhorStreak).toBe(2);
    });

    it('Deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/v1/progresso/streak');

      expect(res.status).toBe(401);
    });

    it('Deve retornar 403 para professores', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenProfDono}`);

      expect(res.status).toBe(403);
    });

    it('Deve retornar streak zerado para aluno sem respostas', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoFora}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        streakAtual: 0,
        melhorStreak: 0,
        ultimaAtividade: null,
      });
    });

    it('Deve retornar os campos esperados para um aluno com respostas', async () => {
      const res = await request(app)
        .get('/api/v1/progresso/streak')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('streakAtual');
      expect(res.body).toHaveProperty('melhorStreak');
      expect(res.body).toHaveProperty('ultimaAtividade');
      expect(typeof res.body.streakAtual).toBe('number');
      expect(typeof res.body.melhorStreak).toBe('number');
      expect(res.body.ultimaAtividade).not.toBeNull();
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

  describe('Novos tipos de questão', () => {
    const criarQuestaoEAssociar = async (tipo, respostaCorreta) => {
      const atividade = await request(app)
        .post('/api/v1/atividades')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({
          titulo: `Questão ${tipo}`,
          materia: 'Português',
          questoes: [
            {
              tipo,
              enunciado: 'Responda à questão',
              respostaCorreta,
            },
          ],
        });

      expect(atividade.status).toBe(201);
      expect(atividade.body.questoes[0].tipo).toBe(tipo);

      const vinculada = await request(app)
        .post(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ idAtividade: atividade.body.id });
      expect(vinculada.status).toBe(201);

      return atividade.body.questoes[0].id;
    };

    it('Corrige questões VERDADEIRO_FALSO sem exigir opções do cliente', async () => {
      const novaQuestaoId = await criarQuestaoEAssociar(
        'VERDADEIRO_FALSO',
        'Verdadeiro'
      );
      const res = await request(app)
        .post('/api/v1/progresso/responder')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({ questaoId: novaQuestaoId, resposta: 'true' });

      expect(res.status).toBe(201);
      expect(res.body.correta).toBe(true);
      expect(res.body).not.toHaveProperty('respostaCorreta');
    });

    it('Corrige LACUNA sem exigir opções e ignora diferença de caixa', async () => {
      const novaQuestaoId = await criarQuestaoEAssociar('LACUNA', 'Brasília');
      const res = await request(app)
        .post('/api/v1/progresso/responder')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({ questaoId: novaQuestaoId, resposta: 'brasília' });

      expect(res.status).toBe(201);
      expect(res.body.correta).toBe(true);
      expect(res.body).not.toHaveProperty('respostaCorreta');
    });
  });

  describe('Prazo de atividade para aluno', () => {
    it('Marca atividade vencida como atrasada até a conclusão', async () => {
      const atividade = await request(app)
        .post('/api/v1/atividades')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({
          titulo: 'Atividade vencida',
          materia: 'Matemática',
          prazo: new Date(Date.now() - 86400000).toISOString(),
          questoes: [
            {
              enunciado: 'Quanto é 1 + 1?',
              opcoes: ['2', '3'],
              respostaCorreta: '0',
            },
          ],
        });
      expect(atividade.status).toBe(201);

      const vinculada = await request(app)
        .post(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ idAtividade: atividade.body.id });
      expect(vinculada.status).toBe(201);

      const listar = () =>
        request(app)
          .get(`/api/v1/salas/${salaId}/atividades`)
          .set('Authorization', `Bearer ${tokenAlunoDentro}`);
      let lista = await listar();
      let atrasada = lista.body.find((item) => item.id === atividade.body.id);
      expect(atrasada.atrasada).toBe(true);
      expect(JSON.stringify(atrasada)).not.toMatch(/respostaCorreta/);

      const resposta = await request(app)
        .post('/api/v1/progresso/responder')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({
          questaoId: atividade.body.questoes[0].id,
          resposta: '0',
        });
      expect(resposta.status).toBe(201);

      lista = await listar();
      atrasada = lista.body.find((item) => item.id === atividade.body.id);
      expect(atrasada.atrasada).toBe(false);
    });
  });
});