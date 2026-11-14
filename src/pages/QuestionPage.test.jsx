import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuestionPage from './QuestionPage';

jest.mock('../services/aiService', () => ({
  pedirDicaAoLumi: jest.fn(),
}));
import { pedirDicaAoLumi } from '../services/aiService';

const Q1 = 'Lumi encontrou 5 estrelas e depois encontrou mais 5. Quantas estrelas ele tem agora?';
const Q2 = 'Lumi tinha 3 lápis e ganhou mais 2. Quantos lápis ele tem agora?';
const Q3 = 'Ana tinha 4 balas e ganhou mais 3. Quantas balas ela tem agora?';

function renderizar({ concluidas = [] } = {}) {
  const setPontos = jest.fn();
  const setConcluidas = jest.fn();

  render(
    <MemoryRouter initialEntries={[{ pathname: '/exercicio/matematica', state: { faseId: 1 } }]}>
      <Routes>
        <Route
          path="/exercicio/:materia"
          element={
            <QuestionPage
              setPontos={setPontos}
              concluidas={concluidas}
              setConcluidas={setConcluidas}
            />
          }
        />
        <Route path="/trilha/:materia" element={<p>Tela da trilha</p>} />
      </Routes>
    </MemoryRouter>
  );

  return { setPontos, setConcluidas, user: userEvent.setup() };
}

const opcao = (texto) => screen.getByRole('button', { name: String(texto) });
const proxima = () => screen.getByRole('button', { name: /Próxima pergunta|Finalizar fase/ });

describe('QuestionPage (matemática, fase 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('mostra a primeira questão, o progresso e o título da fase', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: Q1 })).toBeInTheDocument();
    expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Fase 1 de Matemática: Soma Básica')).toBeInTheDocument();
  });

  it('não deixa avançar sem responder', async () => {
    const { user } = renderizar();
    await user.click(proxima());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Responda a questão antes de continuar.'
    );
    expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
  });

  it('resposta certa: mostra o feedback positivo e trava as opções', async () => {
    const { user } = renderizar();
    await user.click(opcao(10));

    const feedback = screen.getByRole('status');
    expect(feedback).toHaveTextContent('Muito bem!');
    expect(feedback).toHaveTextContent('5 + 5 = 10');
    expect(opcao(9)).toBeDisabled();
  });

  it('resposta errada: mostra "Quase lá!" com a explicação', async () => {
    const { user } = renderizar();
    await user.click(opcao(8));

    const feedback = screen.getByRole('status');
    expect(feedback).toHaveTextContent('Quase lá!');
    expect(feedback).toHaveTextContent('Juntando tudo, temos 10.');
  });

  it('dica do Lumi: chama o serviço com a pergunta e exibe o texto', async () => {
    pedirDicaAoLumi.mockResolvedValue('Conte nos dedinhos! 🦊');
    const { user } = renderizar();

    await user.click(screen.getByRole('button', { name: /Dica do Lumi/ }));

    expect(await screen.findByText('Conte nos dedinhos! 🦊')).toBeInTheDocument();
    expect(pedirDicaAoLumi).toHaveBeenCalledWith(
      Q1,
      [8, 9, 10, 11],
      'Fase 1 de Matemática: Soma Básica'
    );
  });

  it('fluxo completo acertando tudo: avança, finaliza e dá 30 pontos', async () => {
    const { user, setPontos, setConcluidas } = renderizar();

    await user.click(opcao(10));
    await user.click(proxima());
    expect(await screen.findByRole('heading', { name: Q2 })).toBeInTheDocument();

    await user.click(opcao(5));
    await user.click(proxima());
    expect(await screen.findByRole('heading', { name: Q3 })).toBeInTheDocument();

    await user.click(opcao(7));
    await user.click(screen.getByRole('button', { name: /Finalizar fase/ }));

    expect(
      await screen.findByRole('heading', { name: /Parabéns, pequeno explorador/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Resumo da fase')).toBeInTheDocument();

    expect(setPontos).toHaveBeenCalledTimes(1);
    expect(setPontos.mock.calls[0][0](100)).toBe(130);
    expect(setConcluidas).toHaveBeenCalledWith([
      'matematica-mat-f1-1',
      'matematica-mat-f1-2',
      'matematica-mat-f1-3',
    ]);

    const progresso = JSON.parse(localStorage.getItem('lumi_progresso_trilha_matematica'));
    expect(progresso.fase_1).toBe(true);
  });

  it('errando tudo: reprovado, sem pontos, com opção de refazer', async () => {
    const { user, setPontos } = renderizar();

    await user.click(opcao(8));
    await user.click(proxima());
    await user.click(opcao(4));
    await user.click(proxima());
    await user.click(opcao(6));
    await user.click(screen.getByRole('button', { name: /Finalizar fase/ }));

    expect(
      await screen.findByRole('heading', { name: /Vamos tentar mais uma vez/ })
    ).toBeInTheDocument();
    expect(setPontos).not.toHaveBeenCalled();
    expect(localStorage.getItem('lumi_progresso_trilha_matematica')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Refazer desafio' }));
    expect(await screen.findByText('Questão 1 de 3')).toBeInTheDocument();
  });

  it('questões já concluídas antes não pontuam de novo', async () => {
    const { user, setPontos } = renderizar({
      concluidas: ['matematica-mat-f1-1', 'matematica-mat-f1-2', 'matematica-mat-f1-3'],
    });

    await user.click(opcao(10));
    await user.click(proxima());
    await user.click(opcao(5));
    await user.click(proxima());
    await user.click(opcao(7));
    await user.click(screen.getByRole('button', { name: /Finalizar fase/ }));

    expect(
      await screen.findByRole('heading', { name: /Parabéns, pequeno explorador/ })
    ).toBeInTheDocument();
    expect(setPontos).not.toHaveBeenCalled();
  });
});