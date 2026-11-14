import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

jest.unstable_mockModule('../services/lumiService.js', () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: 'ok' }),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true }),
}));

// Envolve o service real num jest.fn, para um teste poder forçar falha
const real = await import('../services/notificationService.js');
jest.unstable_mockModule('../services/notificationService.js', () => ({
  ...real,
  notificarNovaAtividade: jest.fn(real.notificarNovaAtividade),
}));

const { default: app } = await import('../app.js');
const servico = await import('../services/notificationService.js');

describe('Aviso ao associar atividade (POST /api/v1/salas/:id/atividades)', () => {
  let tokenProf, tokenProfOutro, tokenAlunoA, tokenAlunoB, tokenAlunoFora;
  let alunoAId, alunoBId, alunoForaId, profId;
  let salaId, atividadeId, atividadeId2;

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

  const associar = (token, sala, idAtividade) =>
    request(app)
      .post(`/api/v1/salas/${sala}/atividades`)
      .set('Authorization', `Bearer ${token}`)
      .send({ idAtividade });

  const avisosDe = (usuarioId) =>
    prisma.notificacao.findMany({ where: { usuarioId, titulo: 'Nova atividade' } });

  beforeAll(async () => {
    await limparDados();

    const p = await criarUser('professor', 'dono');
    const p2 = await criarUser('professor', 'outro');
    const a = await criarUser('aluno', 'a');
    const b = await criarUser('aluno', 'b');
    const f = await criarUser('aluno', 'fora');
    tokenProf = p.token; profId = p.id;
    tokenProfOutro = p2.token;
    tokenAlunoA = a.token; alunoAId = a.id;
    tokenAlunoB = b.token; alunoBId = b.id;
    tokenAlunoFora = f.token; alunoForaId = f.id;

    const resSala = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({ nome: 'Sala Aviso' });
    salaId = resSala.body.id;

    for (const t of [tokenAlunoA, tokenAlunoB]) {
      const r = await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${t}`)
        .send({ codigo: resSala.body.codigo });
      if (r.status !== 200) throw new Error(`Falha ao entrar na sala: ${JSON.stringify(r.body)}`);
    }

    const at1 = await prisma.atividade.create({
      data: { titulo: 'Frações', materia: 'Matemática', professorId: profId },
    });
    const at2 = await prisma.atividade.create({
      data: { titulo: 'Verbos', materia: 'Português', professorId: profId },
    });
    atividadeId = at1.id;
    atividadeId2 = at2.id;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('exige token (401) e tipo professor (403)', async () => {
    const semToken = await request(app).post(`/api/v1/salas/${salaId}/atividades`).send({ idAtividade: atividadeId });
    expect(semToken.status).toBe(401);

    const aluno = await associar(tokenAlunoA, salaId, atividadeId);
    expect(aluno.status).toBe(403);
  });

  it('403 para professor que não é dono da sala e nenhum aviso é criado', async () => {
    const res = await associar(tokenProfOutro, salaId, atividadeId);
    expect(res.status).toBe(403);
    expect(await avisosDe(alunoAId)).toHaveLength(0);
  });

  it('sucesso: 201 com a resposta atual e aviso só para os matriculados', async () => {
    const res = await associar(tokenProf, salaId, atividadeId);
    expect(res.status).toBe(201);
    expect(res.body.salaId).toBe(salaId);
    expect(res.body.atividadeId).toBe(atividadeId);
    expect(res.body).toHaveProperty('id');

    const avisosA = await avisosDe(alunoAId);
    const avisosB = await avisosDe(alunoBId);
    expect(avisosA).toHaveLength(1);
    expect(avisosB).toHaveLength(1);
    expect(avisosA[0].corpo).toContain('Frações');
    expect(avisosA[0].corpo).toContain('Sala Aviso');
    expect(avisosA[0].lida).toBe(false);

    expect(await avisosDe(alunoForaId)).toHaveLength(0);
    expect(await avisosDe(profId)).toHaveLength(0);
  });

  it('409 ao associar de novo e não duplica o aviso', async () => {
    const res = await associar(tokenProf, salaId, atividadeId);
    expect(res.status).toBe(409);
    expect(await avisosDe(alunoAId)).toHaveLength(1);
  });

  it('se a notificação falhar, a rota ainda responde 201 e o erro vai para o log', async () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    servico.notificarNovaAtividade.mockRejectedValueOnce(new Error('falha simulada'));

    const res = await associar(tokenProf, salaId, atividadeId2);
    expect(res.status).toBe(201);
    expect(res.body.atividadeId).toBe(atividadeId2);
    expect(logSpy).toHaveBeenCalled();

    const noBanco = await prisma.salaAtividade.findFirst({ where: { salaId, atividadeId: atividadeId2 } });
    expect(noBanco).not.toBeNull();
    expect(await avisosDe(alunoAId)).toHaveLength(1); // continua só o aviso anterior

    logSpy.mockRestore();
  });
});