import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

const send = jest.fn();
jest.unstable_mockModule('../services/firebaseAdmin.js', () => ({
  default: { messaging: () => ({ send }) },
}));

const { enviarPush, notificarNovaAtividade } = await import('../services/notificationService.js');
const { enviarLembretesDePrazo } = await import('../services/lembreteService.js');

const sufixo = Math.random().toString(36).substring(2, 8);
const tokA = `push-teste-a-${sufixo}-${Date.now()}`;
const tokB = `push-teste-b-${sufixo}-${Date.now()}`;
const tokFora = `push-teste-fora-${sufixo}-${Date.now()}`;

describe('Push real: enviarPush, nova atividade e lembrete', () => {
  let prof, alunoA, alunoB, alunoFora, sala;

  const criarUsuario = (tipo, nome) =>
    prisma.usuario.create({
      data: { nome, usuario: `${nome}_${sufixo}`, senhaHash: 'hash-falso', tipo },
    });

  const garantirToken = (token, usuarioId) =>
    prisma.notificacaoToken.upsert({
      where: { token },
      update: { usuarioId },
      create: { token, usuarioId },
    });

  beforeAll(async () => {
    await limparDados();
    prof = await criarUsuario('PROFESSOR', 'prof');
    alunoA = await criarUsuario('ALUNO', 'alunoa');
    alunoB = await criarUsuario('ALUNO', 'alunob');
    alunoFora = await criarUsuario('ALUNO', 'alunofora');

    sala = await prisma.sala.create({
      data: { nome: 'Sala Push', codigo: `P${sufixo}`.toUpperCase().slice(0, 8), professorId: prof.id },
    });
    await prisma.matricula.createMany({
      data: [
        { alunoId: alunoA.id, salaId: sala.id },
        { alunoId: alunoB.id, salaId: sala.id },
      ],
    });
  });

  beforeEach(async () => {
    send.mockReset();
    send.mockResolvedValue('id-ok');
    await garantirToken(tokA, alunoA.id);
    await garantirToken(tokB, alunoB.id);
    await garantirToken(tokFora, alunoFora.id);
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('enviarPush envia só para os tokens dos usuários informados', async () => {
    const r = await enviarPush([alunoA.id, alunoB.id], { title: 'T', body: 'C' });
    expect(r).toEqual({ enviadas: 2, falhas: 0 });
    expect(send).toHaveBeenCalledTimes(2);
    const tokensUsados = send.mock.calls.map(([m]) => m.token);
    expect(tokensUsados).toEqual(expect.arrayContaining([tokA, tokB]));
    expect(tokensUsados).not.toContain(tokFora);
  });

  it('remove o token que o Firebase marca como inválido e conta a falha', async () => {
    send.mockImplementation(async (m) => {
      if (m.token === tokB) {
        const e = new Error('invalido');
        e.code = 'messaging/registration-token-not-registered';
        throw e;
      }
      return 'id-ok';
    });

    const r = await enviarPush([alunoA.id, alunoB.id], { title: 'T', body: 'C' });
    expect(r).toEqual({ enviadas: 1, falhas: 1 });
    expect(await prisma.notificacaoToken.findUnique({ where: { token: tokB } })).toBeNull();
    expect(await prisma.notificacaoToken.findUnique({ where: { token: tokA } })).not.toBeNull();
  });

  it('falha genérica de envio não lança erro e não apaga o token', async () => {
    send.mockRejectedValue(new Error('rede indisponível'));
    const r = await enviarPush([alunoA.id], { title: 'T', body: 'C' });
    expect(r).toEqual({ enviadas: 0, falhas: 1 });
    expect(await prisma.notificacaoToken.findUnique({ where: { token: tokA } })).not.toBeNull();
  });

  it('notificarNovaAtividade grava o histórico e envia push só aos matriculados', async () => {
    const criados = await notificarNovaAtividade({
      salaId: sala.id,
      salaNome: sala.nome,
      atividadeTitulo: 'Geometria',
    });
    expect(criados).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    const msg = send.mock.calls[0][0];
    expect(msg.notification.title).toBe('Nova atividade');
    expect(msg.notification.body).toContain('Geometria');
    expect(send.mock.calls.map(([m]) => m.token)).not.toContain(tokFora);
  });

  it('lembrete de prazo envia push uma vez e não repete na segunda execução', async () => {
    const atividade = await prisma.atividade.create({
      data: {
        titulo: 'Entrega Push',
        materia: 'Teste',
        professorId: prof.id,
        prazo: new Date(Date.now() + 3 * 60 * 60 * 1000),
      },
    });
    await prisma.salaAtividade.create({ data: { salaId: sala.id, atividadeId: atividade.id } });

    const primeira = await enviarLembretesDePrazo();
    expect(primeira.lembretes).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].notification.title).toBe('Prazo chegando');

    send.mockClear();
    const segunda = await enviarLembretesDePrazo();
    expect(segunda.lembretes).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});