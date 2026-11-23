import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

describe('Testes de Salas (/api/v1/salas)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let salaId, salaCodigo;

  // Helpers das rotas novas (editar, remover aluno, sair, ranking)
  const comToken = (token) => ({ Authorization: `Bearer ${token}` });
  const idInexistente = '00000000-0000-0000-0000-000000000000';

  const entrarComo = (token) =>
    request(app).post('/api/v1/salas/entrar').set(comToken(token)).send({ codigo: salaCodigo });

  const matriculasDaSala = async () => {
    const res = await request(app).get(`/api/v1/salas/${salaId}`).set(comToken(tokenProfDono));
    return res.body.matriculas;
  };

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

  // ---------------------------------------------------------------
  // NOVAS ROTAS (editar nome, remover aluno, sair da sala, ranking)
  // Ficam antes do DELETE /:id, que apaga a sala no final.
  // ---------------------------------------------------------------

  describe('PATCH /:id (editar nome)', () => {
    it('Professor dono edita o nome da sala', async () => {
      const res = await request(app)
        .patch(`/api/v1/salas/${salaId}`)
        .set(comToken(tokenProfDono))
        .send({ nome: '  Sala Renomeada  ' });

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Sala Renomeada'); // trim aplicado
      expect(res.body.id).toBe(salaId);
    });

    it('Outro professor e aluno recebem 403', async () => {
      const resOutro = await request(app)
        .patch(`/api/v1/salas/${salaId}`)
        .set(comToken(tokenProfOutro))
        .send({ nome: 'Invasão' });
      expect(resOutro.status).toBe(403);

      const resAluno = await request(app)
        .patch(`/api/v1/salas/${salaId}`)
        .set(comToken(tokenAlunoDentro))
        .send({ nome: 'Invasão' });
      expect(resAluno.status).toBe(403);
    });

    it('Deve retornar 401 sem token', async () => {
      const res = await request(app).patch(`/api/v1/salas/${salaId}`).send({ nome: 'Sem token' });
      expect(res.status).toBe(401);
    });

    it('Deve retornar 400 para nome vazio, ausente, objeto ou >100 chars', async () => {
      const enviar = (corpo) =>
        request(app).patch(`/api/v1/salas/${salaId}`).set(comToken(tokenProfDono)).send(corpo);

      expect((await enviar({ nome: '   ' })).status).toBe(400);
      expect((await enviar({})).status).toBe(400);
      expect((await enviar({ nome: { invalido: true } })).status).toBe(400);
      expect((await enviar({ nome: 'A'.repeat(101) })).status).toBe(400);
    });

    it('Deve retornar 404 para sala inexistente', async () => {
      const res = await request(app)
        .patch(`/api/v1/salas/${idInexistente}`)
        .set(comToken(tokenProfDono))
        .send({ nome: 'Qualquer' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id/alunos/:alunoId (professor remove aluno)', () => {
    it('Professor dono remove um aluno da sala (204) e ele some das matrículas', async () => {
      const antes = (await matriculasDaSala()).map((m) => m.alunoId);
      await entrarComo(tokenAlunoFora);
      const nova = (await matriculasDaSala()).find((m) => !antes.includes(m.alunoId));
      expect(nova).toBeDefined();

      const res = await request(app)
        .delete(`/api/v1/salas/${salaId}/alunos/${nova.alunoId}`)
        .set(comToken(tokenProfDono));
      expect(res.status).toBe(204);

      const depois = (await matriculasDaSala()).map((m) => m.alunoId);
      expect(depois).not.toContain(nova.alunoId);

      // O aluno removido perde o acesso à sala
      const resAluno = await request(app).get(`/api/v1/salas/${salaId}`).set(comToken(tokenAlunoFora));
      expect(resAluno.status).toBe(403);
    });

    it('Aluno e outro professor recebem 403', async () => {
      const [alvo] = await matriculasDaSala();

      const resAluno = await request(app)
        .delete(`/api/v1/salas/${salaId}/alunos/${alvo.alunoId}`)
        .set(comToken(tokenAlunoDentro));
      expect(resAluno.status).toBe(403);

      const resOutro = await request(app)
        .delete(`/api/v1/salas/${salaId}/alunos/${alvo.alunoId}`)
        .set(comToken(tokenProfOutro));
      expect(resOutro.status).toBe(403);

      // Ninguém foi removido
      const ids = (await matriculasDaSala()).map((m) => m.alunoId);
      expect(ids).toContain(alvo.alunoId);
    });

    it('Deve retornar 404 para aluno que não está na sala e para sala inexistente', async () => {
      const resAluno = await request(app)
        .delete(`/api/v1/salas/${salaId}/alunos/${idInexistente}`)
        .set(comToken(tokenProfDono));
      expect(resAluno.status).toBe(404);

      const resSala = await request(app)
        .delete(`/api/v1/salas/${idInexistente}/alunos/${idInexistente}`)
        .set(comToken(tokenProfDono));
      expect(resSala.status).toBe(404);
    });
  });

  describe('DELETE /:id/sair (aluno sai da sala)', () => {
    it('Aluno matriculado sai da sala (204) e perde o acesso; sair de novo retorna 404', async () => {
      await entrarComo(tokenAlunoFora);

      const res = await request(app)
        .delete(`/api/v1/salas/${salaId}/sair`)
        .set(comToken(tokenAlunoFora));
      expect(res.status).toBe(204);

      const resDetalhe = await request(app).get(`/api/v1/salas/${salaId}`).set(comToken(tokenAlunoFora));
      expect(resDetalhe.status).toBe(403);

      const resDeNovo = await request(app)
        .delete(`/api/v1/salas/${salaId}/sair`)
        .set(comToken(tokenAlunoFora));
      expect(resDeNovo.status).toBe(404);
    });

    it('Professor recebe 403 e sem token recebe 401', async () => {
      const resProf = await request(app)
        .delete(`/api/v1/salas/${salaId}/sair`)
        .set(comToken(tokenProfDono));
      expect(resProf.status).toBe(403);

      const resSemToken = await request(app).delete(`/api/v1/salas/${salaId}/sair`);
      expect(resSemToken.status).toBe(401);
    });

    it('Deve retornar 404 para sala inexistente', async () => {
      const res = await request(app)
        .delete(`/api/v1/salas/${idInexistente}/sair`)
        .set(comToken(tokenAlunoDentro));
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/ranking', () => {
    it('Professor dono vê a turma ordenada por pontos, com posições sequenciais', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/ranking`)
        .set(comToken(tokenProfDono));

      expect(res.status).toBe(200);
      expect(res.body.sala.id).toBe(salaId);
      expect(Array.isArray(res.body.ranking)).toBe(true);
      expect(res.body.ranking.length).toBeGreaterThanOrEqual(1);

      const pontos = res.body.ranking.map((r) => r.pontos);
      expect(pontos).toEqual([...pontos].sort((a, b) => b - a));
      res.body.ranking.forEach((r, i) => {
        expect(r.posicao).toBe(i + 1);
        expect(r).toHaveProperty('alunoId');
        expect(r).toHaveProperty('nome');
      });
      expect(JSON.stringify(res.body)).not.toMatch(/senhaHash/);
    });

    it('Aluno matriculado também vê o ranking', async () => {
      const res = await request(app)
        .get(`/api/v1/salas/${salaId}/ranking`)
        .set(comToken(tokenAlunoDentro));
      expect(res.status).toBe(200);
    });

    it('Aluno de fora e professor de fora recebem 403', async () => {
      const resAluno = await request(app)
        .get(`/api/v1/salas/${salaId}/ranking`)
        .set(comToken(tokenAlunoFora));
      expect(resAluno.status).toBe(403);

      const resProf = await request(app)
        .get(`/api/v1/salas/${salaId}/ranking`)
        .set(comToken(tokenProfOutro));
      expect(resProf.status).toBe(403);
    });

    it('Deve retornar 401 sem token e 404 para sala inexistente', async () => {
      const resSemToken = await request(app).get(`/api/v1/salas/${salaId}/ranking`);
      expect(resSemToken.status).toBe(401);

      const resInex = await request(app)
        .get(`/api/v1/salas/${idInexistente}/ranking`)
        .set(comToken(tokenProfDono));
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