import request from 'supertest';
import { jest } from '@jest/globals';
import { prisma, limparDados } from './helpers/db.js';

// 1. MOCK do Lumi OBRIGATÓRIO (tem que ser antes de importar o app)
jest.unstable_mockModule('../services/lumiService.js', () => ({
  gerarDica: jest.fn().mockResolvedValue({ dica: 'ok' }),
  verificarStatus: jest.fn().mockResolvedValue({ disponivel: true })
}));

// 2. Importação dinâmica do app (para que ele use o mock)
const { default: app } = await import('../app.js');

// Token push falso: único e com mais de 20 caracteres
const tokenPushFalso = (sufixo) =>
  `ExponentPushToken[${sufixo}-${Date.now()}-${Math.random().toString(36).substring(2, 12)}]`;

describe('Testes de Notificações e Lumi (/api/v1/notificacoes e /api/v1/lumi)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let salaId;

  const registrarToken = async (jwtToken, pushToken) => {
    const res = await request(app)
      .post('/api/v1/notificacoes/token')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ token: pushToken });
    if (res.status !== 200) throw new Error(`Falha ao registrar token: ${JSON.stringify(res.body)}`);
  };

  beforeAll(async () => {
    await limparDados();

    const criarUser = async (tipo, sufixo) => {
      const hash = Math.random().toString(36).substring(2, 7);
      const res = await request(app)
        .post(`/api/v1/auth/register/${tipo}`)
        .send({ nome: `User ${sufixo}`, usuario: `${tipo.substring(0, 4)}_${sufixo}_${hash}`, senha: 'password123' });
      if (res.status !== 201) throw new Error(`Falha no setup (${tipo}): ${JSON.stringify(res.body)}`);
      return res.body.token;
    };

    tokenProfDono = await criarUser('professor', 'dono');
    tokenProfOutro = await criarUser('professor', 'outro');
    tokenAlunoDentro = await criarUser('aluno', 'dentro');
    tokenAlunoFora = await criarUser('aluno', 'fora');

    const resSala = await request(app).post('/api/v1/salas').set('Authorization', `Bearer ${tokenProfDono}`).send({ nome: 'Sala Notif' });
    salaId = resSala.body.id;
    await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ codigo: resSala.body.codigo });
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('Notificações (/api/v1/notificacoes)', () => {
    it('POST /token - Deve exigir autenticação (401), rejeitar token inválido (400) e registrar token válido (200)', async () => {
      const semAuth = await request(app).post('/api/v1/notificacoes/token').send({ token: tokenPushFalso('x') });
      expect(semAuth.status).toBe(401);

      const auth = `Bearer ${tokenAlunoDentro}`;

      const resVazio = await request(app).post('/api/v1/notificacoes/token').set('Authorization', auth).send({});
      expect(resVazio.status).toBe(400);

      const resCurto = await request(app).post('/api/v1/notificacoes/token').set('Authorization', auth).send({ token: 'abc' });
      expect(resCurto.status).toBe(400);

      // Este token fica registrado para o AlunoDentro e é contado no teste de disparo
      const resValido = await request(app).post('/api/v1/notificacoes/token').set('Authorization', auth).send({ token: tokenPushFalso('dentro') });
      expect(resValido.status).toBe(200);
    });

    describe('POST /disparar - validações', () => {
      const payloadValido = () => ({ title: 'Aviso Importante', body: 'Mensagem', salaId });

      it('Deve bloquear aluno (403)', async () => {
        const res = await request(app)
          .post('/api/v1/notificacoes/disparar')
          .set('Authorization', `Bearer ${tokenAlunoDentro}`)
          .send(payloadValido());
        expect(res.status).toBe(403);
      });

      it('Deve retornar 400 para payload vazio', async () => {
        const res = await request(app)
          .post('/api/v1/notificacoes/disparar')
          .set('Authorization', `Bearer ${tokenProfDono}`)
          .send({});
        expect(res.status).toBe(400);
      });

      it('Deve retornar 400 para title com 101 caracteres', async () => {
        const res = await request(app)
          .post('/api/v1/notificacoes/disparar')
          .set('Authorization', `Bearer ${tokenProfDono}`)
          .send({ ...payloadValido(), title: 'A'.repeat(101) });
        expect(res.status).toBe(400);
      });

      it('Deve retornar 400 para body com 501 caracteres', async () => {
        const res = await request(app)
          .post('/api/v1/notificacoes/disparar')
          .set('Authorization', `Bearer ${tokenProfDono}`)
          .send({ ...payloadValido(), body: 'A'.repeat(501) });
        expect(res.status).toBe(400);
      });

      it('Deve retornar 403 ao tentar notificar sala de OUTRO professor', async () => {
        // ProfOutro tenta disparar para a sala do ProfDono
        const res = await request(app)
          .post('/api/v1/notificacoes/disparar')
          .set('Authorization', `Bearer ${tokenProfOutro}`)
          .send(payloadValido());
        expect(res.status).toBe(403);
        expect(res.body.erro).toBe('Você só pode notificar alunos das suas salas');
      });
    });

    it('POST /disparar - Teste principal: notifica apenas os 2 alunos matriculados (enviadas = 2, destinatarios = 2)', async () => {
      // 1. Cria um segundo aluno e matricula na sala
      const hash = Math.random().toString(36).substring(2, 7);
      const resReg = await request(app)
        .post('/api/v1/auth/register/aluno')
        .send({ nome: 'Aluno Novo', usuario: `aluno_novo_${hash}`, senha: 'password123' });
      expect(resReg.status).toBe(201);
      const tokenAlunoNovo = resReg.body.token;

      const salaData = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      const resEntrar = await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${tokenAlunoNovo}`)
        .send({ codigo: salaData.body.codigo });
      expect(resEntrar.status).toBe(200);

      // 2. Registra tokens únicos para o aluno novo e para quem NÃO deve receber
      //    (o AlunoDentro já registrou o dele no teste de POST /token)
      await registrarToken(tokenAlunoNovo, tokenPushFalso('novo'));
      await registrarToken(tokenAlunoFora, tokenPushFalso('fora'));
      await registrarToken(tokenProfOutro, tokenPushFalso('profoutro'));

      // 3. Dispara para a sala
      const res = await request(app)
        .post('/api/v1/notificacoes/disparar')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ title: 'Aviso da Prova', body: 'Teremos prova amanhã', salaId });

      expect(res.status).toBe(200);
      expect(res.body.enviadas).toBe(2);
      expect(res.body.destinatarios).toBe(2);
    });

    it('GET /historico - Aluno da sala vê os avisos, aluno de fora vê array vazio', async () => {
      const resDentro = await request(app).get(`/api/v1/notificacoes/historico?salaId=${salaId}`).set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(resDentro.status).toBe(200);
      expect(resDentro.body.dados.length).toBeGreaterThan(0);

      const resFora = await request(app).get(`/api/v1/notificacoes/historico?salaId=${salaId}`).set('Authorization', `Bearer ${tokenAlunoFora}`);
      expect(resFora.status).toBe(200);
      expect(resFora.body.dados).toEqual([]);
    });
  });

  describe('Lumi IA (/api/v1/lumi)', () => {
    it('GET /status - deve retornar 200 informando disponibilidade do serviço', async () => {
      const res = await request(app).get('/api/v1/lumi/status').set('Authorization', `Bearer ${tokenAlunoDentro}`);
      expect(res.status).toBe(200);
    });

    it('POST /dica - deve bloquear requisição sem token (401) e body vazio (400)', async () => {
      expect((await request(app).post('/api/v1/lumi/dica').send({ pergunta: 'X' })).status).toBe(401);
      expect((await request(app).post('/api/v1/lumi/dica').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({})).status).toBe(400);
    });

    it('POST /dica - deve validar pergunta com mais de 1000 caracteres e opções que não são array (400)', async () => {
      const auth = `Bearer ${tokenAlunoDentro}`;

      const resLonga = await request(app).post('/api/v1/lumi/dica').set('Authorization', auth).send({ pergunta: 'A'.repeat(1001), opcoes: ['A', 'B'] });
      expect(resLonga.status).toBe(400);

      const resOpcoesInvalidas = await request(app).post('/api/v1/lumi/dica').set('Authorization', auth).send({ pergunta: 'Teste?', opcoes: 'nao-e-array' });
      expect(resOpcoesInvalidas.status).toBe(400);
    });

    it('POST /dica - deve retornar 200 com a dica gerada perfeitamente pelo mock', async () => {
      const res = await request(app)
        .post('/api/v1/lumi/dica')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({ pergunta: 'Como resolvo esta equação?', opcoes: ['A', 'B'] });

      expect(res.status).toBe(200);
      expect(res.body.dica).toBe('ok');
    });

    it('POST /dica - deve retornar 503 caso o serviço de IA lance uma falha (Error)', async () => {
      const lumiService = await import('../services/lumiService.js');
      lumiService.gerarDica.mockRejectedValueOnce(new Error('Falha na API da IA'));

      const res = await request(app)
        .post('/api/v1/lumi/dica')
        .set('Authorization', `Bearer ${tokenAlunoDentro}`)
        .send({ pergunta: 'Como resolvo?', opcoes: ['A', 'B'] });

      expect(res.status).toBe(503);
    });
  });
});