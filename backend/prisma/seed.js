import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TIPOS } from "../lib/constants.js";

const prisma = new PrismaClient();

async function upsertUsuario({ usuario, nome, senha, tipo }) {
  const senhaHash = await bcrypt.hash(senha, 10);

  return prisma.usuario.upsert({
    where: { usuario },
    update: {},
    create: { usuario, nome, senha: senhaHash, tipo },
  });
}

async function main() {
  await upsertUsuario({
    usuario: "Joao_Lucas",
    nome: "João_Lucas",
    senha: "prof123",
    tipo: TIPOS.PROFESSOR,
  });

  await upsertUsuario({
    usuario: "Adriel_Azevedo",
    nome: "Adriel_Azevedo",
    senha: "aluno123",
    tipo: TIPOS.ALUNO,
  });

  console.log("Seed concluído: usuários demo criados/verificados.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
