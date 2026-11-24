import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

jest.unstable_mockModule('../services/lumiService.js', () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: 'ok' }),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import('../app.js');

describe('DELETE /api/v1/notificacoes/token', () => {
  let tokenA, tokenB;
  const pushA = `push-del-a-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const criarUser = async (sufixo) => {
    const hash = Math.random().toString(36).substring(2, 7);
    const res = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: `User ${sufixo}`, usuario: `alun_${sufixo}_${hash}`, senha: 'password123' });
    if (res.status !== 201) throw new Error(`Falha no setup: ${JSON.stringify(res.body)}`);
    return res.body.token;
  };

  const apagar = (jwt, body) => {
    const r = request(app).delete('/api/v1/notificacoes/token');
    return (jwt ? r.set('Authorization', `Bearer ${jwt}`) : r).send(body);
  };

  beforeAll(async () => {
    await limparDados();
    tokenA = await criarUser('a');
    tokenB = await criarUser('b');
    const reg = await request(app)
      .post('/api/v1/notificacoes/token')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: pushA });
    expect(reg.status).toBe(200);
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('401 sem login e 400 com token ausente ou curto', async () => {
    expect((await apagar(null, { token: pushA })).status).toBe(401);
    expect((await apagar(tokenA, {})).status).toBe(400);
    expect((await apagar(tokenA, { token: 'abc' })).status).toBe(400);
  });

  it('outro usuário não apaga o token alheio (200, removidos 0) e ele continua no banco', async () => {
    const res = await apagar(tokenB, { token: pushA });
    expect(res.status).toBe(200);
    expect(res.body.removidos).toBe(0);
    expect(await prisma.notificacaoToken.findUnique({ where: { token: pushA } })).not.toBeNull();
  });

  it('o dono apaga o próprio token e repetir é idempotente', async () => {
    const res = await apagar(tokenA, { token: pushA });
    expect(res.status).toBe(200);
    expect(res.body.removidos).toBe(1);
    expect(await prisma.notificacaoToken.findUnique({ where: { token: pushA } })).toBeNull();

    const de_novo = await apagar(tokenA, { token: pushA });
    expect(de_novo.status).toBe(200);
    expect(de_novo.body.removidos).toBe(0);
  });
});