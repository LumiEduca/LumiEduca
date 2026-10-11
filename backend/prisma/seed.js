import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// 1. Trava de segurança: impede rodar o seed em produção acidentalmente
if (process.env.NODE_ENV === 'production') {
  console.error('⚠️ Execução de seed bloqueada em ambiente de produção!');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o seed...');

  // 2. Lê a senha do .env ou usa fallback local
  const rawPassword = process.env.SEED_PASSWORD || 'senha_local_123';
  const senhaHash = await bcrypt.hash(rawPassword, 10);

  // 3. Professor (nomes alterados para não dar conflito)
  const professor = await prisma.usuario.upsert({
    where: { usuario: 'professor_seed' },
    update: {},
    create: {
      nome: 'Professor Teste',
      usuario: 'professor_seed',
      senhaHash: senhaHash,
      tipo: 'PROFESSOR',
    },
  });
  console.log('✅ Professor garantido.');

  // 4. Aluno (nomes alterados)
  const aluno = await prisma.usuario.upsert({
    where: { usuario: 'aluno_seed' },
    update: {},
    create: {
      nome: 'Aluno Teste',
      usuario: 'aluno_seed',
      senhaHash: senhaHash,
      tipo: 'ALUNO',
    },
  });
  console.log('✅ Aluno garantido.');

  // 5. Sala
  const sala = await prisma.sala.upsert({
    where: { codigo: 'LUMI-101' },
    update: {},
    create: {
      nome: 'Lógica de Programação',
      codigo: 'LUMI-101',
      professor: { connect: { id: professor.id } },
    },
  });
  console.log('✅ Sala criada.');

  // 6. Matrícula
  await prisma.matricula.upsert({
    where: {
      alunoId_salaId: {
        alunoId: aluno.id,
        salaId: sala.id,
      },
    },
    update: {},
    create: {
      aluno: { connect: { id: aluno.id } },
      sala: { connect: { id: sala.id } },
    },
  });
  console.log('✅ Aluno matriculado na sala.');

  // 7. Atividade
  const atividadeIdFixa = 'seed-atividade-001';
  const atividade = await prisma.atividade.upsert({
    where: { id: atividadeIdFixa },
    update: {},
    create: {
      id: atividadeIdFixa,
      titulo: 'Introdução aos Algoritmos',
      materia: 'Computação',
      prazo: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      professor: { connect: { id: professor.id } },
    },
  });
  console.log('✅ Atividade criada.');

  // 8. Associar Atividade à Sala
  await prisma.salaAtividade.upsert({
    where: {
      salaId_atividadeId: {
        salaId: sala.id,
        atividadeId: atividade.id,
      },
    },
    update: {},
    create: {
      sala: { connect: { id: sala.id } },
      atividade: { connect: { id: atividade.id } },
    },
  });
  console.log('✅ Atividade vinculada à sala.');

  // 9. Questões (sem JSON.stringify, direto no array)
  await prisma.questao.upsert({
    where: { id: 'seed-questao-001' },
    update: {},
    create: {
      id: 'seed-questao-001',
      enunciado: 'Qual destas estruturas é um laço de repetição?',
      opcoes: ["if/else", "while", "switch", "try/catch"], // Correção aqui
      respostaCorreta: 'while',
      ordem: 1,
      atividade: { connect: { id: atividade.id } },
    },
  });

  await prisma.questao.upsert({
    where: { id: 'seed-questao-002' },
    update: {},
    create: {
      id: 'seed-questao-002',
      enunciado: 'Qual é o tipo de variável que armazena verdadeiro ou falso?',
      opcoes: ["String", "Integer", "Boolean", "Float"], // Correção aqui
      respostaCorreta: 'Boolean',
      ordem: 2,
      atividade: { connect: { id: atividade.id } },
    },
  });
  console.log('✅ Questões geradas.');

  console.log('🎉 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });