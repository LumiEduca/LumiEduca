import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Iniciando o Prisma com o adaptador do Neon
export const prisma = new PrismaClient({ adapter });

export const limparDados = async () => {
  // A ordem de deleção é crucial para não ferir as foreign keys
  await prisma.resposta.deleteMany();
  await prisma.progresso.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.notificacaoToken.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.salaAtividade.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.atividade.deleteMany();
  await prisma.usuario.deleteMany();
};