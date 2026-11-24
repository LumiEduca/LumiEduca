import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

jest.unstable_mockModule('../services/lumiService.js', () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: 'ok' }),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

const { default: app } = await import('../app.js');

const CHAVE = 'chave-de-teste-cron-123';
const HORA = 60 * 60 * 1000;

describe('Lembrete de prazo (GET /api/v1/notificacoes/cron/lembretes)', () => {
  let alunoA, alunoB, alunoFora, profId, salaId;
  let atProxima, atLonge, atPassada;
  const secretOriginal = process.env.CRON_SECRET;

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

  const chamar = (chave) => {
    const r = request(app).get('/api/v1/notificacoes/cron/lembretes');
    return chave ? r.set('Authorization', `Bearer ${chave}`) : r;
  };

  const lembretesDe = (usuarioId) =>
    prisma.notificacao.findMany({ where: { usuarioId, titulo: 'Prazo chegando' } });

  beforeAll(async () => {
    process.env.CRON_SECRET = CHAVE;
    await limparDados();

    const prof = await criarUser('professor', 'dono');
    const a = await criarUser('aluno', 'a');
    const b = await criarUser('aluno', 'b');
    const f = await criarUser('aluno', 'fora');
    profId = prof.id; alunoA = a; alunoB = b; alunoFora = f;

    const resSala = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${prof.token}`)
      .send({ nome: 'Sala Lembrete' });
    salaId = resSala.body.id;

    for (const t of [a.token, b.token]) {
      const r = await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${t}`)
        .send({ codigo: resSala.body.codigo });
      if (r.status !== 200) throw new Error(`Falha ao entrar na sala: ${JSON.stringify(r.body)}`);
    }

    const agora = Date.now();
    const criarAtividade = (titulo, prazo) =>
      prisma.atividade.create({ data: { titulo, materia: 'Teste', professorId: profId, prazo } });

    atProxima = await criarAtividade('Prazo Próximo', new Date(agora + 3 * HORA));
    atLonge = await criarAtividade('Prazo Longe', new Date(agora + 72 * HORA));
    atPassada = await criarAtividade('Prazo Passado', new Date(agora - 2 * HORA));

    for (const at of [atProxima, atLonge, atPassada]) {
      await prisma.salaAtividade.create({ data: { salaId, atividadeId: at.id } });
    }

    // Aluno B já concluiu a atividade próxima
    await prisma.progresso.create({
      data: { alunoId: b.id, atividadeId: atProxima.id, concluida: true },
    });
  });

  afterAll(async () => {
    if (secretOriginal === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = secretOriginal;
    await limparDados();
    await prisma.$disconnect();
  });

  it('401 sem chave, com chave errada e quando CRON_SECRET não está configurado', async () => {
    expect((await chamar()).status).toBe(401);

    const errada = await chamar('chave-errada');
    expect(errada.status).toBe(401);
    expect(errada.body.erro).toBe('Não autorizado');

    delete process.env.CRON_SECRET;
    expect((await chamar(CHAVE)).status).toBe(401);
    process.env.CRON_SECRET = CHAVE;

    expect(await lembretesDe(alunoA.id)).toHaveLength(0);
  });

  it('com a chave certa: avisa só quem não concluiu, só da atividade com prazo nas próximas 24h', async () => {
    const res = await chamar(CHAVE);
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.atividades).toBe(1);
    expect(res.body.lembretes).toBe(1);

    const avisosA = await lembretesDe(alunoA.id);
    expect(avisosA).toHaveLength(1);
    expect(avisosA[0].corpo).toContain('Prazo Próximo');
    expect(avisosA[0].lida).toBe(false);

    expect(await lembretesDe(alunoB.id)).toHaveLength(0);    // já concluiu
    expect(await lembretesDe(alunoFora.id)).toHaveLength(0); // não está na sala
    expect(await lembretesDe(profId)).toHaveLength(0);

    const registros = await prisma.lembreteAtividade.findMany();
    expect(registros).toHaveLength(1);
    expect(registros[0].alunoId).toBe(alunoA.id);
    expect(registros[0].atividadeId).toBe(atProxima.id);
  });

  it('segunda execução não duplica o lembrete', async () => {
    const res = await chamar(CHAVE);
    expect(res.status).toBe(200);
    expect(res.body.lembretes).toBe(0);

    expect(await lembretesDe(alunoA.id)).toHaveLength(1);
    expect(await prisma.lembreteAtividade.count()).toBe(1);
  });
});