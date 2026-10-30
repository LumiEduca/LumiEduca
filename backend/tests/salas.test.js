import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Salas (/api/v1/salas)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let salaId, salaCodigo;

  beforeAll(async () => {
    await limparDados();

    // Helper para criar usuários e capturar tokens via endpoint real
    const criarUser = async (tipo, sufixo) => {
      const hashCurto = Math.random().toString(36).substring(2, 7); 
      const nomeUsuario = `${tipo.substring(0, 4)}_${sufixo}_${hashCurto}`;

      const res = await request(app)
        .post(`/api/v1/auth/register/${tipo}`)
        .send({ nome: `User ${sufixo}`, usuario: nomeUsuario, senha: 'password123' });
      
      if (res.status !== 201) throw new Error(`Falha no setup: ${res.body.erro}`);
      return res.body.token;
    };

    tokenProfDono = await criarUser('professor', 'dono');
    tokenProfOutro = await criarUser('professor', 'outro');
    tokenAlunoDentro = await criarUser('aluno', 'dentro');
    tokenAlunoFora = await criarUser('aluno', 'fora');
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('POST /', () => {
    it('Deve criar uma sala retornando 201 com id e codigo de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/v1/salas')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ nome: 'Sala de Lógica' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('codigo');
      expect(res.body.codigo.length).toBe(6);
      
      salaId = res.body.id;
      salaCodigo = res.body.codigo;
    });

    it('Deve retornar 403 se um aluno tentar criar sala', async () => {
      const res = await request(app).post('/api/v1/salas').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ nome: 'Hackeando' });
      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('Apenas professor pode acessar esta rota');
    });

    it('Deve retornar 401 sem token e 400 para validações de nome (ausente, objeto, >100 chars)', async () => {
      const resSemToken = await request(app).post('/api/v1/salas').send({ nome: 'Sala' });
      expect(resSemToken.status).toBe(401);

      const auth = `Bearer ${tokenProfDono}`;
      
      const resVazio = await request(app).post('/api/v1/salas').set('Authorization', auth).send({});
      expect(resVazio.status).toBe(400);

      const resObjeto = await request(app).post('/api/v1/salas').set('Authorization', auth).send({ nome: { invalido: true } });
      expect(resObjeto.status).toBe(400);

      const resLongo = await request(app).post('/api/v1/salas').set('Authorization', auth).send({ nome: 'A'.repeat(101) });
      expect(resLongo.status).toBe(400);
    });
  });

  describe('POST /entrar', () => {
    it('Deve permitir entrada de aluno com código correto (mesmo em minúsculas) sem vazar codigo/senhaHash', async () => {
      const res = await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({ codigo: salaCodigo.toLowerCase() }); // Testando lowercase

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('codigo');
      expect(res.body).not.toHaveProperty('senhaHash');
      expect(JSON.stringify(res.body)).not.toMatch(/senhaHash/);
    });

    it('Deve impedir a entrada de professor (403)', async () => {
      const res = await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenProfOutro}`).send({ codigo: salaCodigo });
      expect(res.status).toBe(403);
    });

    it('Deve retornar 404 para código errado e 400 para corpo inválido', async () => {
      const resErrado = await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoFora}`).send({ codigo: 'ERRADO' });
      expect(resErrado.status).toBe(404);
      expect(resErrado.body.erro).toBe('Código de acesso inválido');

      const resVazio = await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoFora}`).send({});
      expect(resVazio.status).toBe(400);

      const resObj = await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoFora}`).send({ codigo: { a: 1 } });
      expect(resObj.status).toBe(400);
    });

    it('Deve lidar corretamente com dupla entrada do mesmo aluno na mesma sala', async () => {
      const res = await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ codigo: salaCodigo });
      expect([200, 409]).toContain(res.status); // Aceita 200 ou 409, mas nunca 500
    });
  });

  describe('GET /', () => {
    it('Professor deve ver apenas suas salas com totalAlunos', async () => {
      const resDono = await request(app).get('/api/v1/salas').set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resDono.status).toBe(200);
      expect(resDono.body.length).toBe(1);
      expect(resDono.body[0]).toHaveProperty('totalAlunos');

      const resOutro = await request(app).get('/api/v1/salas').set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resOutro.status).toBe(200);
      expect(resOutro.body).toEqual([]); // Outro professor vê vazio
    });

    it('Deve retornar 403 para alunos', async () => {
      const res = await request(app).get('/api/v1/salas').set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /:id', () => {
    it('Dono da sala recebe 200 sem vazar senhaHash nas matrículas', async () => {
      const res = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toMatch(/senhaHash/);
      expect(res.body.matriculas).toBeDefined();
    });

    it('Aluno matriculado recebe 200, mas com resposta filtrada (sem codigo e sem matriculas)', async () => {
      const res = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('codigo');
      expect(res.body).not.toHaveProperty('matriculas');
    });

    it('Professor de fora e aluno não matriculado recebem 403', async () => {
      const resProf = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resProf.status).toBe(403);

      const resAluno = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenAlunoFora}`);
      expect(resAluno.status).toBe(403);
      expect(resAluno.body.erro).toBe('Você não tem acesso a esta sala');
    });

    it('Deve retornar 400 para ID estranho e 404 para inexistente', async () => {
      const resEstranho = await request(app).get(`/api/v1/salas/abc.def`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resEstranho.status).toBe(400);
      expect(resEstranho.body.erro).toBe('Identificador inválido');

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const resInex = await request(app).get(`/api/v1/salas/${fakeId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resInex.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('Deve impedir deleção por alunos ou outros professores (403)', async () => {
      const resAluno = await request(app).delete(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(resAluno.status).toBe(403);

      const resOutro = await request(app).delete(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfOutro}`);
      expect(resOutro.status).toBe(403);
    });

    it('Dono da sala deve deletar com sucesso (204) mesmo com alunos matriculados, evitando erro 500', async () => {
      // Sala tem o AlunoDentro matriculado, testando a resiliência das FKs no banco
      const resDel = await request(app).delete(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resDel.status).toBe(204);

      // GET subsequente deve dar 404
      const resGet = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      expect(resGet.status).toBe(404);
    });
  });
});