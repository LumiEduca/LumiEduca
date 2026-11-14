import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

// Mock do Lumi (antes de importar o app), igual ao notificacoes-lumi.test.js
jest.unstable_mockModule('../services/lumiService.js', () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: 'ok' }),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import('../app.js');

describe('Notificações: lidas e contagem (/api/v1/notificacoes)', () => {
  let tokenAluno1, tokenAluno2, tokenProf;
  let aluno1Id, aluno2Id;
  let idNaoLida, idJaLida, idDoAluno2;

  const criarUser = async (tipo, sufixo) => {
    const hash = Math.random().toString(36).substring(2, 7);
    const usuario = `${tipo.substring(0, 4)}_${sufixo}_${hash}`;
    const res = await request(app)
      .post(`/api/v1/auth/register/${tipo}`)
      .send({ nome: `User ${sufixo}`, usuario, senha: 'password123' });
    if (res.status !== 201) throw new Error(`Falha no setup (${tipo}): ${JSON.stringify(res.body)}`);
    const registro = await prisma.usuario.findUnique({ where: { usuario } });
    return { token: res.body.token, id: registro.id };
  };

  const contagem = (token) =>
    request(app).get('/api/v1/notificacoes/nao-lidas/contagem').set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    await limparDados();

    const a1 = await criarUser('aluno', 'um');
    const a2 = await criarUser('aluno', 'dois');
    const p = await criarUser('professor', 'prof');
    tokenAluno1 = a1.token; aluno1Id = a1.id;
    tokenAluno2 = a2.token; aluno2Id = a2.id;
    tokenProf = p.token;

    // Aluno 1: 2 não lidas + 1 já lida. Aluno 2: 1 não lida.
    const n1 = await prisma.notificacao.create({ data: { usuarioId: aluno1Id, titulo: 'T1', corpo: 'C1' } });
    await prisma.notificacao.create({ data: { usuarioId: aluno1Id, titulo: 'T2', corpo: 'C2' } });
    const n3 = await prisma.notificacao.create({ data: { usuarioId: aluno1Id, titulo: 'T3', corpo: 'C3', lida: true } });
    const n4 = await prisma.notificacao.create({ data: { usuarioId: aluno2Id, titulo: 'T4', corpo: 'C4' } });
    idNaoLida = n1.id;
    idJaLida = n3.id;
    idDoAluno2 = n4.id;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('autenticação (401)', () => {
    it('as 3 rotas exigem token', async () => {
      expect((await request(app).get('/api/v1/notificacoes/nao-lidas/contagem')).status).toBe(401);
      expect((await request(app).patch('/api/v1/notificacoes/lidas')).status).toBe(401);
      expect((await request(app).patch(`/api/v1/notificacoes/${idNaoLida}/lida`)).status).toBe(401);
    });
  });

  describe('GET /nao-lidas/contagem', () => {
    it('conta só as não lidas do próprio usuário', async () => {
      const res1 = await contagem(tokenAluno1);
      expect(res1.status).toBe(200);
      expect(res1.body.total).toBe(2);

      const res2 = await contagem(tokenAluno2);
      expect(res2.status).toBe(200);
      expect(res2.body.total).toBe(1);
    });

    it('retorna 0 para quem não tem notificações (professor)', async () => {
      const res = await contagem(tokenProf);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });
  });

  describe('PATCH /:id/lida', () => {
    it('outro usuário não pode marcar (404) e a notificação continua não lida', async () => {
      const res = await request(app)
        .patch(`/api/v1/notificacoes/${idNaoLida}/lida`)
        .set('Authorization', `Bearer ${tokenAluno2}`);
      expect(res.status).toBe(404);
      expect(res.body.erro).toBe('Notificação não encontrada');

      const noBanco = await prisma.notificacao.findUnique({ where: { id: idNaoLida } });
      expect(noBanco.lida).toBe(false);
    });

    it('id inexistente retorna 404', async () => {
      const res = await request(app)
        .patch('/api/v1/notificacoes/00000000-0000-4000-8000-000000000000/lida')
        .set('Authorization', `Bearer ${tokenAluno1}`);
      expect(res.status).toBe(404);
    });

    it('o dono marca como lida (200) e a contagem diminui', async () => {
      const res = await request(app)
        .patch(`/api/v1/notificacoes/${idNaoLida}/lida`)
        .set('Authorization', `Bearer ${tokenAluno1}`);
      expect(res.status).toBe(200);
      expect(res.body.dados.lida).toBe(true);

      expect((await contagem(tokenAluno1)).body.total).toBe(1);
    });

    it('marcar uma já lida continua retornando 200 (idempotente)', async () => {
      const res = await request(app)
        .patch(`/api/v1/notificacoes/${idJaLida}/lida`)
        .set('Authorization', `Bearer ${tokenAluno1}`);
      expect(res.status).toBe(200);
      expect(res.body.dados.lida).toBe(true);
    });
  });

  describe('PATCH /lidas', () => {
    it('marca todas as do usuário e não mexe nas dos outros', async () => {
      const res = await request(app)
        .patch('/api/v1/notificacoes/lidas')
        .set('Authorization', `Bearer ${tokenAluno1}`);
      expect(res.status).toBe(200);
      expect(res.body.atualizadas).toBe(1); // restava 1 não lida do aluno 1

      expect((await contagem(tokenAluno1)).body.total).toBe(0);

      const doAluno2 = await prisma.notificacao.findUnique({ where: { id: idDoAluno2 } });
      expect(doAluno2.lida).toBe(false);
      expect((await contagem(tokenAluno2)).body.total).toBe(1);
    });
  });

  describe('GET /historico (formato atual preservado)', () => {
    it('continua retornando { sucesso, dados } com o campo lida', async () => {
      const res = await request(app)
        .get('/api/v1/notificacoes/historico')
        .set('Authorization', `Bearer ${tokenAluno1}`);
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados).toHaveLength(3);
      expect(res.body.dados[0]).toHaveProperty('lida');
    });
  });
});