import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o seed...');

  const senhaProfessorHash = await bcrypt.hash('prof123', 10);
  const senhaAlunoHash = await bcrypt.hash('aluno123', 10);

  // 1. Professor
  const professor = await prisma.usuario.upsert({
    where: { usuario: 'joao_lucas' },
    update: {},
    create: {
      nome: 'João Lucas',
      usuario: 'joao_lucas',
      senhaHash: senhaProfessorHash,
      tipo: 'PROFESSOR',
    },
  });
  console.log('✅ Professor garantido.');

  // 2. Aluno
  const aluno = await prisma.usuario.upsert({
    where: { usuario: 'adriel_azevedo' },
    update: {},
    create: {
      nome: 'Adriel Azevedo',
      usuario: 'adriel_azevedo',
      senhaHash: senhaAlunoHash,
      tipo: 'ALUNO',
    },
  });
  console.log('✅ Aluno garantido.');

  // 3. Sala
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

  // 4. Matrícula
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

  // 5. Atividade (Sem a conexão direta com a sala)
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

  // 6. Associar Atividade à Sala (Via tabela pivô SalaAtividade correta)
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

  // 7. Questões
  await prisma.questao.upsert({
    where: { id: 'seed-questao-001' },
    update: {},
    create: {
      id: 'seed-questao-001',
      enunciado: 'Qual destas estruturas é um laço de repetição?',
      opcoes: JSON.stringify(["if/else", "while", "switch", "try/catch"]),
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
      opcoes: JSON.stringify(["String", "Integer", "Boolean", "Float"]),
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