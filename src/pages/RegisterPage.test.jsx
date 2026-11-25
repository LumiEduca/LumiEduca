import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { mockarLocation, respostaJson } from '../testUtils';

const renderizar = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

const campo = (rotulo) => screen.getByLabelText(rotulo, { selector: 'input' });

describe('RegisterPage', () => {
  let restaurarLocation;

  beforeEach(() => {
    localStorage.clear();
    restaurarLocation = mockarLocation();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    restaurarLocation();
    jest.resetAllMocks();
  });

  const preencher = async ({ nome, usuario, senha, confirmar }) => {
    const user = userEvent.setup();
    if (nome !== undefined) await user.type(campo('Nome'), nome);
    if (usuario !== undefined) await user.type(campo('Usuário'), usuario);
    if (senha !== undefined) await user.type(campo('Senha'), senha);
    if (confirmar !== undefined) await user.type(campo('Confirmar senha'), confirmar);
    return user;
  };

  const enviar = (user) => user.click(screen.getByRole('button', { name: 'Criar conta' }));

  it('cadastro de professor: chama a rota certa, salva a sessão e vai para a Home', async () => {
    global.fetch.mockReturnValue(
      respostaJson(
        { token: 'jwt-novo', usuario: { nome: 'Ana Souza', tipo: 'PROFESSOR' } },
        { status: 201 }
      )
    );

    renderizar();
    const user = await preencher({
      nome: '  Ana Souza ',
      usuario: 'ana.souza',
      senha: 'senha-segura-1',
      confirmar: 'senha-segura-1',
    });
    await enviar(user);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/auth/register/professor');
    expect(JSON.parse(opcoes.body)).toEqual({
      nome: 'Ana Souza',
      usuario: 'ana.souza',
      senha: 'senha-segura-1',
    });

    expect(localStorage.getItem('token')).toBe('jwt-novo');
    expect(localStorage.getItem('userType')).toBe('professor');
    expect(localStorage.getItem('userName')).toBe('Ana Souza');
    expect(window.location.href).toBe('/');
  });

  it('cadastro de aluno usa a rota de aluno', async () => {
    global.fetch.mockReturnValue(
      respostaJson({ token: 't', usuario: { nome: 'Leo', tipo: 'ALUNO' } }, { status: 201 })
    );

    renderizar();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Aluno' }));
    await preencher({
      nome: 'Leo',
      usuario: 'leo123',
      senha: 'senha-segura-1',
      confirmar: 'senha-segura-1',
    });
    await enviar(user);

    expect(global.fetch.mock.calls[0][0]).toContain('/api/v1/auth/register/aluno');
    expect(localStorage.getItem('userType')).toBe('aluno');
  });

  describe('validações do front (o fetch não é chamado)', () => {
    const casos = [
      [
        'nome curto',
        { nome: 'A', usuario: 'usuario1', senha: 'senha-segura-1', confirmar: 'senha-segura-1' },
        'O nome deve ter entre 2 e 100 caracteres.',
      ],
      [
        'usuário com caractere inválido',
        { nome: 'Ana', usuario: 'ana souza', senha: 'senha-segura-1', confirmar: 'senha-segura-1' },
        /O usuário deve ter de 3 a 30 caracteres/,
      ],
      [
        'senha com menos de 8 caracteres',
        { nome: 'Ana', usuario: 'ana123', senha: 'curta12', confirmar: 'curta12' },
        'A senha deve ter pelo menos 8 caracteres.',
      ],
      [
        'senha longa demais (mais de 72 bytes)',
        { nome: 'Ana', usuario: 'ana123', senha: 'a'.repeat(73), confirmar: 'a'.repeat(73) },
        'A senha é longa demais (máximo de 72 caracteres).',
      ],
      [
        'senhas diferentes',
        { nome: 'Ana', usuario: 'ana123', senha: 'senha-segura-1', confirmar: 'senha-segura-2' },
        'As senhas não conferem.',
      ],
    ];

    it.each(casos)('%s', async (_nome, dados, mensagem) => {
      renderizar();
      const user = await preencher(dados);
      await enviar(user);

      expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('usuário já existente (409): mostra o erro do back e reabilita o botão', async () => {
    global.fetch.mockReturnValue(
      respostaJson({ erro: 'Esse usuário já está em uso' }, { ok: false, status: 409 })
    );

    renderizar();
    const user = await preencher({
      nome: 'Ana',
      usuario: 'ana123',
      senha: 'senha-segura-1',
      confirmar: 'senha-segura-1',
    });
    await enviar(user);

    expect(await screen.findByText('Esse usuário já está em uso')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled()
    );
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('');
  });

  it('servidor fora do ar: mostra mensagem de conexão', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to fetch'));

    renderizar();
    const user = await preencher({
      nome: 'Ana',
      usuario: 'ana123',
      senha: 'senha-segura-1',
      confirmar: 'senha-segura-1',
    });
    await enviar(user);

    expect(
      await screen.findByText(/Não foi possível conectar ao servidor/)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled()
    );
  });
});