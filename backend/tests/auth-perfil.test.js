import request from 'supertest';
import app from '../app.js';
import { prisma, limparDados } from './helpers/db.js';

const MSG = 'Não foi possível alterar a senha. Verifique os dados informados.';

describe('Perfil (PATCH /api/v1/auth/me e /api/v1/auth/senha)', () => {
  const usuario = `perfil.${Date.now()}`;
  const senhaInicial = 'password123';
  let token;

  const login = (senha) =>
    request(app).post('/api/v1/auth/login/aluno').send({ usuario, senha });

  const trocar = (body, jwt = token) => {
    const r = request(app).patch('/api/v1/auth/senha');
    return (jwt ? r.set('Authorization', `Bearer ${jwt}`) : r).send(body);
  };

  const mudarNome = (body, jwt = token) => {
    const r = request(app).patch('/api/v1/auth/me');
    return (jwt ? r.set('Authorization', `Bearer ${jwt}`) : r).send(body);
  };

  beforeAll(async () => {
    await limparDados();
    const res = await request(app)
      .post('/api/v1/auth/register/aluno')
      .send({ nome: 'Nome Antigo', usuario, senha: senhaInicial });
    if (res.status !== 201) throw new Error(`Falha no setup: ${JSON.stringify(res.body)}`);
    token = res.body.token;
  });

  afterAll(async () => {
    await limparDados();
    await prisma.$disconnect();
  });

  describe('PATCH /me', () => {
    it('401 sem token', async () => {
      expect((await mudarNome({ nome: 'Novo Nome' }, null)).status).toBe(401);
    });

    it('400 para nome ausente, curto, longo ou que não é texto', async () => {
      expect((await mudarNome({})).status).toBe(400);
      expect((await mudarNome({ nome: 'A' })).status).toBe(400);
      expect((await mudarNome({ nome: 'A'.repeat(101) })).status).toBe(400);
      expect((await mudarNome({ nome: { x: 1 } })).status).toBe(400);
    });

    it('200 atualiza só o nome (com trim), sem senhaHash, e ignora tipo/usuario enviados', async () => {
      const res = await mudarNome({ nome: '  Nome Novo  ', tipo: 'PROFESSOR', usuario: 'invasor' });
      expect(res.status).toBe(200);
      expect(res.body.usuario.nome).toBe('Nome Novo');
      expect(res.body.usuario).not.toHaveProperty('senhaHash');

      const noBanco = await prisma.usuario.findUnique({ where: { usuario } });
      expect(noBanco.nome).toBe('Nome Novo');
      expect(noBanco.tipo).toBe('ALUNO');

      const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(me.body.usuario.nome).toBe('Nome Novo');
    });
  });

  describe('PATCH /senha', () => {
    it('401 sem token', async () => {
      expect((await trocar({ senhaAtual: senhaInicial, novaSenha: 'outra-senha-1' }, null)).status).toBe(401);
    });

    it('400 com mensagem única quando faltam campos', async () => {
      const res = await trocar({});
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe(MSG);
    });

    it('senha atual errada: 400, mesma mensagem e a senha não muda', async () => {
      const res = await trocar({ senhaAtual: 'errada-123456', novaSenha: 'nova-senha-123' });
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe(MSG);
      expect((await login(senhaInicial)).status).toBe(200);
    });

    it('nova senha curta, longa demais (73 bytes) ou igual à atual: 400 com a mesma mensagem', async () => {
      const curta = await trocar({ senhaAtual: senhaInicial, novaSenha: 'curta12' });
      expect(curta.status).toBe(400);
      expect(curta.body.erro).toBe(MSG);

      const longa = await trocar({ senhaAtual: senhaInicial, novaSenha: 'a'.repeat(73) });
      expect(longa.status).toBe(400);
      expect(longa.body.erro).toBe(MSG);

      const igual = await trocar({ senhaAtual: senhaInicial, novaSenha: senhaInicial });
      expect(igual.status).toBe(400);
      expect(igual.body.erro).toBe(MSG);

      expect((await login(senhaInicial)).status).toBe(200);
    });

    it('sucesso: 200, login com a nova funciona e a antiga deixa de valer', async () => {
      const res = await trocar({ senhaAtual: senhaInicial, novaSenha: 'nova-senha-123' });
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body).not.toHaveProperty('senhaHash');

      expect((await login('nova-senha-123')).status).toBe(200);
      expect((await login(senhaInicial)).status).toBe(401);
    });
  });
});