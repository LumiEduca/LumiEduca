import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { mockarLocation, respostaJson } from '../testUtils';

const renderizar = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
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

  const preencher = async (usuario, senha) => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Usuário'), usuario);
    await user.type(screen.getByLabelText('Senha'), senha);
    return user;
  };

  it('login de professor: chama a rota certa, salva a sessão e vai para a Home', async () => {
    global.fetch.mockReturnValue(
      respostaJson({
        token: 'jwt-falso',
        usuario: { nome: 'Maria', tipo: 'PROFESSOR' },
      })
    );

    renderizar();
    const user = await preencher('maria.prof', 'senha-segura-1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/auth/login/professor');
    expect(opcoes.method).toBe('POST');
    expect(JSON.parse(opcoes.body)).toEqual({ usuario: 'maria.prof', senha: 'senha-segura-1' });

    expect(localStorage.getItem('token')).toBe('jwt-falso');
    expect(localStorage.getItem('userType')).toBe('professor');
    expect(localStorage.getItem('userName')).toBe('Maria');
    expect(window.location.href).toBe('/');
  });

  it('login de aluno usa a rota de aluno', async () => {
    global.fetch.mockReturnValue(
      respostaJson({ token: 't', usuario: { nome: 'Joao', tipo: 'ALUNO' } })
    );

    renderizar();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Aluno' }));
    await user.type(screen.getByLabelText('Usuário'), 'joao');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(global.fetch.mock.calls[0][0]).toContain('/api/v1/auth/login/aluno');
    expect(localStorage.getItem('userType')).toBe('aluno');
  });

  it('credenciais inválidas: mostra o erro do back e não salva sessão', async () => {
    global.fetch.mockReturnValue(
      respostaJson({ erro: 'Usuário ou senha inválidos' }, { ok: false, status: 401 })
    );

    renderizar();
    const user = await preencher('maria.prof', 'errada-12345');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Usuário ou senha inválidos')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('');
  });

  it('servidor fora do ar: mostra mensagem de conexão', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to fetch'));

    renderizar();
    const user = await preencher('maria.prof', 'senha-segura-1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText(/Não foi possível conectar ao servidor/)
    ).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});