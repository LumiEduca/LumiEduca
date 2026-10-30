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
        throw new Error(`Falha ao registrar ${tipo}: Status ${res.status} Resposta: ${JSON.stringify(res.body)}`);
      }
      
      return res.body.token;
    };

    tokenProfDono = await criarUser('professor', 'dono2');
    tokenProfOutro = await criarUser('professor', 'outro2');
    tokenAlunoDentro = await criarUser('aluno', 'dentro2');
    tokenAlunoFora = await criarUser('aluno', 'fora2');

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

      if (res.status !== 201) throw new Error(`Erro ao criar atividade: ${JSON.stringify(res.body)}`);

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

    it('Deve retornar 400 para regras de validação estrutural sem reutilizar o request', async () => {
      const auth = `Bearer ${tokenProfDono}`;

      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({})).status).toBe(400); 
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, titulo: 'A'.repeat(151) })).status).toBe(400); 
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, questoes: [] })).status).toBe(400); 
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, prazo: 'data-invalida' })).status).toBe(400); 
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1'], respostaCorreta: '1', ordem: 1 }] })).status).toBe(400);
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1','2','3','4','5','6','7'], respostaCorreta: '1', ordem: 1 }] })).status).toBe(400);
      expect((await request(app).post('/api/v1/atividades').set('Authorization', auth).send({ ...payloadAtividadeValida, questoes: [{ enunciado: '?', opcoes: ['1', '2'], respostaCorreta: '5', ordem: 1 }] })).status).toBe(400);
    });
  });

  describe('GET /api/v1/atividades', () => {
    it('Professor dono vê suas atividades, outro professor recebe array vazio', async () => {
      const resDono = await request(app).get('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resDono.status).toBe(200);
      expect(resDono.body.length).toBeGreaterThan(0);

      const resOutro = await request(app).get('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resOutro.status).toBe(200);
      expect(resOutro.body).toEqual([]);
    });

    it('Aluno não pode listar atividades gerais (403)', async () => {
      const res = await request(app).get('/api/v1/atividades').set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(403);
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

    it('Deve retornar 403 ao tentar associar uma atividade de outro professor', async () => {
      // ProfOutro cria uma atividade dele
      const resAtiv = await request(app).post('/api/v1/atividades').set('Authorization', `Bearer ${tokenProfOutro}`).send(payloadAtividadeValida);
      const ativOutroId = resAtiv.body.id;

      // ProfDono tenta associar a atividade do ProfOutro na sua sala
      const res = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ idAtividade: ativOutroId });
      expect(res.status).toBe(403);
    });

    it('Deve bloquear alunos, professores de fora, e validar o campo idAtividade (400 e 404)', async () => {
      const resAluno = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ idAtividade: atividadeId });
      expect(resAluno.status).toBe(403);

      const resOutroProf = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfOutro}`).send({ idAtividade: atividadeId });
      expect(resOutroProf.status).toBe(403);

      const resIdObjeto = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ idAtividade: { obj: true } });
      expect(resIdObjeto.status).toBe(400);

      const resIdInexistente = await request(app).post(`/api/v1/salas/${salaId}/atividades`).set('Authorization', `Bearer ${tokenProfDono}`).send({ idAtividade: '00000000-0000-0000-0000-000000000000' });
      expect(resIdInexistente.status).toBe(404);
    });
  });

  describe('GET /api/v1/salas/:id/atividades (Visualização por Sala)', () => {
    it('Professor dono vê as atividades da sala com a respostaCorreta exposta', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfDono}`); 

      expect(res.status).toBe(200);
      expect(res.body[0].questoes[0]).toHaveProperty('respostaCorreta');
    }); 

    it('Aluno matriculado vê as atividades mas a respostaCorreta é filtrada da API', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenAlunoDentro}`);  

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0); // garante que o teste não é vazio
      expect(JSON.stringify(res.body)).not.toMatch(/respostaCorreta/);
    }); 

    it('Aluno de fora recebe 403', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenAlunoFora}`);  

      expect(res.status).toBe(403);
    }); 

    it('Professor de fora recebe 403', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/atividades`)
        .set('Authorization', `Bearer ${tokenProfOutro}`);  

      expect(res.status).toBe(403);
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

    it('Professor de fora (403) e Aluno sem sala (403) recebem acesso negado', async () => {
      const resProfFora = await request(app).get(`/api/v1/atividades/${atividadeId}`).set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resProfFora.status).toBe(403);

      const resAlunoFora = await request(app).get(`/api/v1/atividades/${atividadeId}`).set('Authorization', `Bearer ${tokenAlunoFora}`);
      expect(resAlunoFora.status).toBe(403);
    });

    it('Id estranho (400) e Inexistente (404)', async () => {
      expect((await request(app).get(`/api/v1/atividades/abc.def`).set('Authorization', `Bearer ${tokenProfDono}`)).status).toBe(400);
      expect((await request(app).get(`/api/v1/atividades/00000000-0000-0000-0000-000000000000`).set('Authorization', `Bearer ${tokenProfDono}`)).status).toBe(404);
    });
  });
});