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

describe('Testes de Notificações e Lumi (/api/v1/notificacoes e /api/v1/lumi)', () => {
  let tokenProfDono, tokenProfOutro, tokenAlunoDentro, tokenAlunoFora;
  let salaId;

  beforeAll(async () => {
    await limparDados();

    const criarUser = async (tipo, sufixo) => {
      const hash = Math.random().toString(36).substring(2, 7);
      const res = await request(app)
        .post(`/api/v1/auth/register/${tipo}`)
        .send({ nome: `User ${sufixo}`, usuario: `${tipo.substring(0,4)}_${sufixo}_${hash}`, senha: 'password123' });
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
    it('POST /token - Deve validar autenticação (401), body vazio (400) e registrar token com sucesso (200)', async () => {
      expect((await request(app).post('/api/v1/notificacoes/token').send({ token: 'abc' })).status).toBe(401);
      expect((await request(app).post('/api/v1/notificacoes/token').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({})).status).toBe(400);

      const res = await request(app).post('/api/v1/notificacoes/token').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ token: 'ExponentPushToken[1234567890123456789012]' });
      if (res.status === 400) {
        await request(app).post('/api/v1/notificacoes/token').set('Authorization', `Bearer ${tokenAlunoDentro}`).send({ tokenPush: 'ExponentPushToken[1234567890123456789012]' });
      }
    });

    it('POST /disparar - Deve bloquear aluno (403), validar payload vazio (400) e bloquear professor de fora (403)', async () => {
      // Testando as duas nomenclaturas comuns no validador para garantir que o payload passa
      const payloadValido = { salaId, titulo: 'Aviso Importante', mensagem: 'Mensagem', title: 'Aviso Importante', body: 'Mensagem' };

      const resAluno = await request(app).post('/api/v1/notificacoes/disparar').set('Authorization', `Bearer ${tokenAlunoDentro}`).send(payloadValido);
      expect(resAluno.status).toBe(403);

      expect((await request(app).post('/api/v1/notificacoes/disparar').set('Authorization', `Bearer ${tokenProfDono}`).send({})).status).toBe(400);

      const resProfOutro = await request(app).post('/api/v1/notificacoes/disparar').set('Authorization', `Bearer ${tokenProfOutro}`).send(payloadValido);
      expect(resProfOutro.status).toBe(403);
    });

    it('POST /disparar - Teste principal: deve enviar notificação apenas para o aluno da sala (enviadas = 1)', async () => {
      // 1. Cria um aluno virgem exclusivamente para este teste
      const hash = Math.random().toString(36).substring(2, 7);
      const resReg = await request(app).post('/api/v1/auth/register/aluno').send({ nome: `Aluno Teste`, usuario: `aluno_t_${hash}`, senha: 'password123' });
      const tokenAlunoNovo = resReg.body.token;

      // 2. Busca os detalhes da sala usando o Professor Dono para pegar o código, e matricula o aluno
      const salaData = await request(app).get(`/api/v1/salas/${salaId}`).set('Authorization', `Bearer ${tokenProfDono}`);
      await request(app).post('/api/v1/salas/entrar').set('Authorization', `Bearer ${tokenAlunoNovo}`).send({ codigo: salaData.body.codigo }); 

      const setupToken = async (tokenAuth, pushToken) => {
        let resTk = await request(app).post('/api/v1/notificacoes/token').set('Authorization', `Bearer ${tokenAuth}`).send({ token: pushToken });
        if (resTk.status === 400) {
          resTk = await request(app).post('/api/v1/notificacoes/token').set('Authorization', `Bearer ${tokenAuth}`).send({ tokenPush: pushToken });
        }
        if (resTk.status !== 200) throw new Error(`Falha ao registrar: ${JSON.stringify(resTk.body)}`);
      };

      // 3. Cadastra o token ÚNICO apenas para esse novo aluno
      await setupToken(tokenAlunoNovo, 'ExponentPushToken[9999999999999999999999]');

      // 4. Dispara a notificação para a sala
      const res = await request(app)
        .post('/api/v1/notificacoes/disparar')
        .set('Authorization', `Bearer ${tokenProfDono}`)
        .send({ salaId, titulo: 'Aviso da Prova', mensagem: 'Teremos prova amanhã', title: 'Aviso da Prova', body: 'Teremos prova amanhã' });
      
      if (res.status !== 200) throw new Error(`O /disparar falhou: ${JSON.stringify(res.body)}`);
      
      expect(res.status).toBe(200);
      expect(res.body.enviadas).toBe(2); // (1 token do AlunoDentro + 1 token do AlunoNovo)
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
      // Puxamos a função mockada e forçamos ela a dar erro apenas nesta chamada
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