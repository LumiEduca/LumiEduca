import prisma from "../config/prismaClient.js";

const JANELA_MS = 24 * 60 * 60 * 1000;

const formatarPrazo = (data) =>
  data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// Notifica alunos que ainda não concluíram atividades com prazo nas próximas 24h.
// Nunca envia duas vezes o mesmo par (aluno, atividade).
export const enviarLembretesDePrazo = async (agora = new Date()) => {
  const limite = new Date(agora.getTime() + JANELA_MS);

  const atividades = await prisma.atividade.findMany({
    where: { prazo: { gt: agora, lte: limite } },
    select: {
      id: true,
      titulo: true,
      prazo: true,
      salaAtividades: {
        select: { sala: { select: { matriculas: { select: { alunoId: true } } } } },
      },
    },
  });

  let lembretes = 0;

  for (const atividade of atividades) {
    const alunoIds = new Set();
    for (const sa of atividade.salaAtividades) {
      for (const m of sa.sala.matriculas) alunoIds.add(m.alunoId);
    }
    if (alunoIds.size === 0) continue;

    const concluidos = await prisma.progresso.findMany({
      where: { atividadeId: atividade.id, concluida: true, alunoId: { in: [...alunoIds] } },
      select: { alunoId: true },
    });
    for (const c of concluidos) alunoIds.delete(c.alunoId);

    for (const alunoId of alunoIds) {
      try {
        await prisma.$transaction([
          prisma.lembreteAtividade.create({ data: { alunoId, atividadeId: atividade.id } }),
          prisma.notificacao.create({
            data: {
              usuarioId: alunoId,
              titulo: "Prazo chegando",
              corpo: `A atividade "${atividade.titulo}" vence em ${formatarPrazo(atividade.prazo)}.`,
            },
          }),
        ]);
        lembretes++;
      } catch (error) {
        if (error.code === "P2002") continue; // já avisado antes
        console.error("Falha ao criar lembrete de prazo:", error);
      }
    }
  }

  return { atividades: atividades.length, lembretes };
};