import * as repo from "../repositories/avaliacaoDemoRepository.js";

const arredondar = (n) => Number(n.toFixed(2));

export const registrar = ({ jogo, nota }) => repo.criar({ jogo, nota });

export const resumo = async () => {
  const grupos = await repo.contagemPorJogoENota();
  const porJogo = new Map();

  for (const g of grupos) {
    const qtd = g._count._all;
    if (!porJogo.has(g.jogo)) {
      porJogo.set(g.jogo, {
        jogo: g.jogo,
        total: 0,
        soma: 0,
        distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
    const j = porJogo.get(g.jogo);
    j.total += qtd;
    j.soma += g.nota * qtd;
    j.distribuicao[g.nota] = qtd;
  }

  let total = 0;
  let somaGeral = 0;
  const jogos = [...porJogo.values()].map(({ soma, ...j }) => {
    total += j.total;
    somaGeral += soma;
    return { ...j, media: arredondar(soma / j.total) };
  });

  return { total, media: total ? arredondar(somaGeral / total) : null, jogos };
};