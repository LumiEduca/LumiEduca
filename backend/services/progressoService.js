import prisma from "../config/prismaClient.js";
import { ApiError } from "../middlewares/errorHandler.js";

const PONTOS_POR_ACERTO = 10;

function respostaEstaCorreta(questao, resposta) {
  const recebida = String(resposta).trim();
  if (questao.tipo === "VERDADEIRO_FALSO") {
    const normalizar = (valor) => {
      const respostaNormalizada = String(valor).trim().toLocaleLowerCase("pt-BR");
      if (["true", "verdadeiro"].includes(respostaNormalizada)) return "verdadeiro";
      if (["false", "falso"].includes(respostaNormalizada)) return "falso";
      return respostaNormalizada;
    };
    return normalizar(recebida) === normalizar(questao.respostaCorreta);
  }

  if (questao.tipo === "LACUNA") {
    return recebida.toLocaleLowerCase("pt-BR") ===
      questao.respostaCorreta.trim().toLocaleLowerCase("pt-BR");
  }

  return recebida === questao.respostaCorreta.trim();
}

const CATALOGO_CONQUISTAS = {
  PRIMEIRA_ATIVIDADE: {
    nome: "Primeira conquista",
    descricao: "Concluiu sua primeira atividade.",
  },
  CINCO_ACERTOS: {
    nome: "Mente brilhante",
    descricao: "Acertou cinco questÃµes consecutivas.",
  },
  CEM_PONTOS: {
    nome: "100 pontos",
    descricao: "Acumulou 100 pontos.",
  },
};

function calcularEstrelas(acertos, total, concluida) {
  if (!concluida || total === 0) return 0;
  const taxa = acertos / total;
  if (taxa >= 0.9) return 3;
  if (taxa >= 0.6) return 2;
  return 1;
}

// Monta as fases (uma por atividade com questÃµes) das salas do aluno
async function montarFases(alunoId) {
  const matriculas = await prisma.matricula.findMany({
    where: { alunoId },
    select: { salaId: true },
  });
  const salaIds = matriculas.map((m) => m.salaId);

  const atividades = await prisma.atividade.findMany({
    where: { salaAtividades: { some: { salaId: { in: salaIds } } } },
    orderBy: { criadaEm: "asc" },
    select: {
      id: true,
      titulo: true,
      materia: true,
      questoes: { select: { id: true } },
    },
  });

  const respostas = await prisma.resposta.findMany({
    where: { alunoId },
    select: { correta: true, questao: { select: { atividadeId: true } } },
  });

  return atividades
    .filter((a) => a.questoes.length > 0)
    .map((a, i) => {
      const doAluno = respostas.filter((r) => r.questao.atividadeId === a.id);
      const acertos = doAluno.filter((r) => r.correta).length;
      const total = a.questoes.length;
      const concluida = doAluno.length >= total;
      return {
        ordem: i + 1,
        atividadeId: a.id,
        titulo: a.titulo,
        materia: a.materia,
        questoesTotal: total,
        questoesRespondidas: doAluno.length,
        concluida,
        pontos: acertos * PONTOS_POR_ACERTO,
        estrelas: calcularEstrelas(acertos, total, concluida),
      };
    });
}

function somarTotais(fases) {
  return {
    totalPontos: fases.reduce((s, f) => s + f.pontos, 0),
    totalEstrelas: fases.reduce((s, f) => s + f.estrelas, 0),
  };
}

// Registra uma conquista sem permitir duplicidade
async function concederConquista(tx, alunoId, codigo) {
  const dados = CATALOGO_CONQUISTAS[codigo];

  const conquista = await tx.conquista.upsert({
    where: { codigo },
    update: {},
    create: {
      codigo,
      nome: dados.nome,
      descricao: dados.descricao,
    },
  });

  const resultado = await tx.usuarioConquista.createMany({
    data: [{ alunoId, conquistaId: conquista.id }],
    skipDuplicates: true,
  });

  // SÃ³ retorna quando a conquista foi realmente concedida agora

  if (resultado.count === 0) return null;

  return {
    codigo: conquista.codigo,
    nome: conquista.nome,
    descricao: conquista.descricao,
  };
}

export async function responderQuestao(alunoId, { questaoId, resposta }) {
  const questao = await prisma.questao.findUnique({
    where: { id: questaoId },
    include: { atividade: { select: { id: true, materia: true } } },
  });
  if (!questao) throw new ApiError(404, "QuestÃ£o nÃ£o encontrada");

  const atividadeId = questao.atividade.id;

  // Aluno precisa estar em alguma sala que tenha esta atividade
  const matricula = await prisma.matricula.findFirst({
    where: { alunoId, sala: { salaAtividades: { some: { atividadeId } } } },
  });
  if (!matricula) {
    throw new ApiError(403, "Esta atividade nÃ£o estÃ¡ disponÃ­vel para vocÃª");
  }

  const jaRespondeu = await prisma.resposta.findUnique({
    where: { alunoId_questaoId: { alunoId, questaoId } },
  });
  if (jaRespondeu) throw new ApiError(409, "VocÃª jÃ¡ respondeu esta questÃ£o");

  const correta = respostaEstaCorreta(questao, resposta);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.resposta.create({
        data: { alunoId, questaoId, resposta: String(resposta), correta },
      });

      const total = await tx.questao.count({ where: { atividadeId } });
      const respondidas = await tx.resposta.count({
        where: { alunoId, questao: { atividadeId } },
      });
      const acertos = await tx.resposta.count({
        where: { alunoId, correta: true, questao: { atividadeId } },
      });

      const concluida = respondidas >= total;
      const pontos = acertos * PONTOS_POR_ACERTO;

      await tx.progresso.upsert({
        where: { alunoId_atividadeId: { alunoId, atividadeId } },
        update: { pontos, concluida },
        create: {
          alunoId,
          atividadeId,
          materia: questao.atividade.materia,
          pontos,
          concluida,
        },
      });

      // Verifica quais conquistas foram desbloqueadas
      const novasConquistas = [];

      // 1. Primeira atividade concluÃ­da
      const atividadesConcluidas = await tx.progresso.count({
        where: { alunoId, concluida: true },
      });

      if (atividadesConcluidas >= 1) {
        const conquista = await concederConquista(
          tx,
          alunoId,
          "PRIMEIRA_ATIVIDADE"
        );
        if (conquista) novasConquistas.push(conquista);
      }

         // 2. Cinco respostas corretas consecutivas
      const ultimasRespostas = await tx.resposta.findMany({
        where: { alunoId },
        orderBy: [{ respondidaEm: "desc" }, { id: "desc" }],
        take: 5,
        select: { correta: true },
      });

      if (
        ultimasRespostas.length === 5 &&
        ultimasRespostas.every((r) => r.correta)
      ) {
        const conquista = await concederConquista(
          tx,
          alunoId,
          "CINCO_ACERTOS"
        );

        if (conquista) novasConquistas.push(conquista);
      }

      // 3. Cem pontos acumulados em todas as atividades
      const pontuacaoTotal = await tx.progresso.aggregate({
        where: { alunoId },
        _sum: { pontos: true },
      });

      if ((pontuacaoTotal._sum.pontos ?? 0) >= 100) {
        const conquista = await concederConquista(
          tx,
          alunoId,
          "CEM_PONTOS"
        );
        if (conquista) novasConquistas.push(conquista);
      }
      return {
        correta,
        pontosGanhos: correta ? PONTOS_POR_ACERTO : 0,
        atividade: {
          id: atividadeId,
          questoesTotal: total,
          questoesRespondidas: respondidas,
          concluida,
          pontos,
          estrelas: calcularEstrelas(acertos, total, concluida),
        },
      };
    });
  } catch (error) {
    // Duas requisiÃ§Ãµes simultÃ¢neas para a mesma questÃ£o
    if (error.code === "P2002") {
      throw new ApiError(409, "VocÃª jÃ¡ respondeu esta questÃ£o");
    }
    throw error;
  }
}

export async function progressoGeral(solicitante, alunoId) {
  const aluno = await prisma.usuario.findUnique({
    where: { id: alunoId },
    select: { id: true, nome: true, usuario: true, tipo: true },
  });
  if (!aluno || aluno.tipo !== "ALUNO") {
    throw new ApiError(404, "Aluno nÃ£o encontrado");
  }

  if (solicitante.tipo === "ALUNO") {
    if (solicitante.id !== alunoId) {
      throw new ApiError(403, "VocÃª sÃ³ pode ver o seu prÃ³prio progresso");
    }
  } else {
    const vinculo = await prisma.matricula.findFirst({
      where: { alunoId, sala: { professorId: solicitante.id } },
    });
    if (!vinculo) throw new ApiError(403, "Este aluno nÃ£o pertence Ã s suas salas");
  }

  const fases = await montarFases(alunoId);
  return {
    aluno: { id: aluno.id, nome: aluno.nome, usuario: aluno.usuario },
    ...somarTotais(fases),
    fasesConcluidas: fases.filter((f) => f.concluida).length,
    totalFases: fases.length,
    fases,
  };
}

export async function trilhaDoAluno(alunoId) {
  const fases = await montarFases(alunoId);

  let atualMarcada = false;
  const trilha = fases.map((f) => {
    if (f.concluida) return { ...f, estado: "CONCLUIDA" };
    if (!atualMarcada) {
      atualMarcada = true;
      return { ...f, estado: "ATUAL" };
    }
    return { ...f, estado: "BLOQUEADA" };
  });

  return {
    faseAtualId: trilha.find((f) => f.estado === "ATUAL")?.atividadeId ?? null,
    ...somarTotais(fases),
    fases: trilha,
  };
}

export async function listarConquistasDoAluno(alunoId) {
  const registros = await prisma.usuarioConquista.findMany({
    where: { alunoId },
    orderBy: { concedidaEm: "desc" },
    select: {
      concedidaEm: true,
      conquista: {
        select: {
          codigo: true,
          nome: true,
          descricao: true,
        },
      },
    },
  });

  const conquistas = registros.map((registro) => ({
    ...registro.conquista,
    concedidaEm: registro.concedidaEm,
  }));

  return {
    total: conquistas.length,
    conquistas,
  };
}

export async function calcularStreakDoAluno(alunoId) {
  const respostas = await prisma.resposta.findMany({
    where: { alunoId },
    orderBy: { respondidaEm: "desc" },
    select: { respondidaEm: true },
  });

  if (respostas.length === 0) {
    return {
      streakAtual: 0,
      melhorStreak: 0,
      ultimaAtividade: null,
    };
  }

  const formatarDia = (data) => {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
};

  const diasAtivos = [
    ...new Set(respostas.map((resposta) => formatarDia(resposta.respondidaEm))),
  ];

  const converterDia = (dia) => {
    const [ano, mes, diaDoMes] = dia.split("-").map(Number);
    return Date.UTC(ano, mes - 1, diaDoMes) / 86400000;
  };

  const diasNumericos = diasAtivos.map(converterDia);

  let melhorStreak = 1;
  let sequencia = 1;

  for (let i = 1; i < diasNumericos.length; i++) {
    if (diasNumericos[i - 1] - diasNumericos[i] === 1) {
      sequencia++;
      melhorStreak = Math.max(melhorStreak, sequencia);
    } else {
      sequencia = 1;
    }
  }

  const hoje = converterDia(formatarDia(new Date()));
  const ontem = hoje - 1;
  const diaMaisRecente = diasNumericos[0];

  let streakAtual = 0;

  if (diaMaisRecente === hoje || diaMaisRecente === ontem) {
    streakAtual = 1;

    for (let i = 1; i < diasNumericos.length; i++) {
      if (diasNumericos[i - 1] - diasNumericos[i] === 1) {
        streakAtual++;
      } else {
        break;
      }
    }
  }

  return {
    streakAtual,
    melhorStreak,
    ultimaAtividade: respostas[0].respondidaEm,
  };
}

function calcularTaxaAcerto(acertos, respondidas) {
  if (respondidas === 0) return 0;
  return Number(((acertos / respondidas) * 100).toFixed(2));
}

export async function gerarRelatorioDaSala(professorId, salaId) {
  // Verifica se a sala existe e pertence ao professor
  const sala = await prisma.sala.findUnique({
    where: { id: salaId },
    select: {
      id: true,
      nome: true,
      professorId: true,
    },
  });

  if (!sala) {
    throw new ApiError(404, "Sala não encontrada");
  }

  if (sala.professorId !== professorId) {
    throw new ApiError(403, "Você não tem permissão para acessar esta sala");
  }

  // Busca todos os alunos matriculados, inclusive os sem respostas
  const matriculas = await prisma.matricula.findMany({
    where: { salaId },
    select: {
      aluno: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  const alunos = matriculas.map((matricula) => matricula.aluno);
  const alunoIds = alunos.map((aluno) => aluno.id);

  // Busca as atividades vinculadas à sala e suas questões
  const atividades = await prisma.atividade.findMany({
    where: {
      salaAtividades: {
        some: { salaId },
      },
    },
    select: {
      id: true,
      materia: true,
      questoes: {
        select: { id: true },
      },
    },
  });

  const atividadeIds = atividades.map((atividade) => atividade.id);

  // Busca as respostas dos alunos matriculados
  const respostas = await prisma.resposta.findMany({
    where: {
      alunoId: { in: alunoIds },
      questao: {
        atividadeId: { in: atividadeIds },
      },
    },
    select: {
      alunoId: true,
      correta: true,
      questao: {
        select: {
          atividadeId: true,
        },
      },
    },
  });

  // Organiza as atividades por matéria

  const materias = new Map();

  for (const atividade of atividades) {
    if (!materias.has(atividade.materia)) {
      materias.set(atividade.materia, {
        materia: atividade.materia,
        questoesPorAluno: 0,
        questoesTotal: 0,
        questoesRespondidas: 0,
        acertos: 0,
      });
    }

    const materia = materias.get(atividade.materia);
    materia.questoesPorAluno += atividade.questoes.length;
  }

  // Calcula os totais de respostas por matéria

  for (const resposta of respostas) {
    const atividade = atividades.find(
      (item) => item.id === resposta.questao.atividadeId
    );

    if (!atividade) continue;

    const materia = materias.get(atividade.materia);
    materia.questoesRespondidas++;

    if (resposta.correta) {
      materia.acertos++;
    }
  }

  const resumoPorMateria = [...materias.values()].map((materia) => ({
    materia: materia.materia,
    questoesTotal: materia.questoesPorAluno * alunos.length,
    questoesRespondidas: materia.questoesRespondidas,
    acertos: materia.acertos,
    taxaAcerto: calcularTaxaAcerto(
      materia.acertos,
      materia.questoesRespondidas
    ),
  }));

  // Monta o desempenho individual de cada aluno
  const relatorioAlunos = alunos.map((aluno) => {
    const respostasDoAluno = respostas.filter(
      (resposta) => resposta.alunoId === aluno.id
    );

    const materiasDoAluno = [...materias.values()].map((materia) => {
      const atividadesDaMateria = atividades.filter(
        (atividade) => atividade.materia === materia.materia
      );

      const idsDasAtividades = atividadesDaMateria.map(
        (atividade) => atividade.id
      );

      const respostasDaMateria = respostasDoAluno.filter((resposta) =>
        idsDasAtividades.includes(resposta.questao.atividadeId)
      );

      const acertos = respostasDaMateria.filter(
        (resposta) => resposta.correta
      ).length;

      return {
        materia: materia.materia,
        questoesTotal: materia.questoesPorAluno,
        questoesRespondidas: respostasDaMateria.length,
        acertos,
        taxaAcerto: calcularTaxaAcerto(
          acertos,
          respostasDaMateria.length
        ),
      };
    });

    const acertos = respostasDoAluno.filter(
      (resposta) => resposta.correta
    ).length;

    return {
      aluno,
      questoesTotal: atividades.reduce(
        (total, atividade) => total + atividade.questoes.length,
        0
      ),
      questoesRespondidas: respostasDoAluno.length,
      acertos,
      taxaAcerto: calcularTaxaAcerto(
        acertos,
        respostasDoAluno.length
      ),
      materias: materiasDoAluno,
    };
  });

  return {
    sala: {
      id: sala.id,
      nome: sala.nome,
    },
    resumoPorMateria,
    alunos: relatorioAlunos,
  };
}
