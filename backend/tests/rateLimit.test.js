import request from 'supertest';
import { prisma, limparDados } from './helpers/db.js';
import { assinarToken } from '../config/jwt.js';

// ATENÇÃO: Ativa o limitador de requisições no ambiente de testes ANTES de carregar a aplicação
process.env.ENABLE_RATE_LIMIT_IN_TEST = 'true';
const { default: app } = await import('../app.js');

describe('Testes de Rate Limit (Proteção contra força bruta)', () => {
  const rotaCadastro = '/api/v1/auth/register/aluno';
  const rotaLogin = '/api/v1/auth/login/aluno';

  let tokenAluno;
  let tokenProf;

  // Cria o usuário direto no banco e assina o token, sem passar pela API.
  // Assim o setup não consome vagas do limite de cadastro.
  const criarUsuarioApoio = async (tipo, prefixo) => {
    const hash = Math.random().toString(36).substring(2, 7);
    const usuario = await prisma.usuario.create({
      data: {
        nome: `Rate Limit ${tipo}`,
        usuario: `${prefixo}_${hash}`,
        senhaHash: 'hash-ficticio-nunca-usado-para-login',
        tipo
      }
    });
    return assinarToken({ id: usuario.id, tipo: usuario.tipo });
  };

  beforeAll(async () => {
    tokenAluno = await criarUsuarioApoio('ALUNO', 'rla');
    tokenProf = await criarUsuarioApoio('PROFESSOR', 'rlp');
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  it('Cadastro: as 5 primeiras requisições passam e a 6ª recebe 429', async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).post(rotaCadastro).send({});
      expect(res.status).toBe(400); // chegou ao handler (validação), não foi bloqueada
    }

    const res = await request(app).post(rotaCadastro).send({});
    expect(res.status).toBe(429);
  });

  it('Deve retornar 429 após 10 tentativas no Login (11ª falha)', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post(rotaLogin).send({});
    }
    const res = await request(app).post(rotaLogin).send({});

    // Trava para avisar caso a rota não seja essa
    if (res.status === 404) throw new Error(`A rota de login não é ${rotaLogin}. Troque a string na variável rotaLogin.`);

    expect(res.status).toBe(429);
  });

  it('Deve retornar 429 após 10 tentativas ao entrar em sala (11ª falha)', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/salas/entrar')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({});
    }
    const res = await request(app)
      .post('/api/v1/salas/entrar')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({});

    expect(res.status).toBe(429);
  });

  it('Deve retornar 429 após 10 tentativas no Disparo de Notificações (11ª falha)', async () => {
    // tokenProf passa do middleware que bloqueia alunos (403)
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/notificacoes/disparar')
        .set('Authorization', `Bearer ${tokenProf}`)
        .send({});
    }
    const res = await request(app)
      .post('/api/v1/notificacoes/disparar')
      .set('Authorization', `Bearer ${tokenProf}`)
      .send({});

    expect(res.status).toBe(429);
  });
});