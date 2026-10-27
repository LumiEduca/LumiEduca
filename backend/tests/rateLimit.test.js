import request from 'supertest';

// ATENÇÃO: Ativa o limitador de requisições no ambiente de testes ANTES de carregar a aplicação
process.env.ENABLE_RATE_LIMIT_IN_TEST = 'true';
const { default: app } = await import('../app.js');

describe('Testes de Rate Limit (Proteção contra força bruta)', () => {
  let tokenAluno;
  let tokenProf;

  beforeAll(async () => {
    // 1. Registra um aluno
    const hashAluno = Math.random().toString(36).substring(2, 7);
    const resAluno = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Rate Limit Aluno', usuario: `rla_${hashAluno}`, senha: 'password123' });
    tokenAluno = resAluno.body.token;

    // 2. Registra um professor (necessário para a rota de notificação não barrar no 403)
    const hashProf = Math.random().toString(36).substring(2, 7);
    const resProf = await request(app)
      .post('/api/v1/auth/register/professor')
      .send({ nome: 'Rate Limit Prof', usuario: `rlp_${hashProf}`, senha: 'password123' });
    tokenProf = resProf.body.token;
  });

  it('Deve retornar 429 após 5 tentativas no Cadastro (6ª falha)', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/register/aluno').send({}); 
    }
    const res = await request(app).post('/api/v1/auth/register/aluno').send({});
    expect(res.status).toBe(429);
  });

  it('Deve retornar 429 após 10 tentativas no Login (11ª falha)', async () => {
    // Ajustado para a rota específica de aluno. 
    // Se no seu projeto for diferente (ex: /api/v1/auth/login/usuarios), ajuste a string abaixo.
    const rotaLogin = '/api/v1/auth/login/aluno'; 

    for (let i = 0; i < 10; i++) {
      await request(app).post(rotaLogin).send({});
    }
    const res = await request(app).post(rotaLogin).send({});
    
    // Trava para avisar caso a rota ainda não seja essa
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
    // Usamos tokenProf para passar do middleware de bloqueio de alunos
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