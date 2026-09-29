/*
  Warnings:

  - You are about to drop the column `salaId` on the `atividades` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "atividades" DROP CONSTRAINT "atividades_salaId_fkey";

-- AlterTable
ALTER TABLE "atividades" DROP COLUMN "salaId";

-- CreateTable
CREATE TABLE "sala_atividades" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sala_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sala_atividades_salaId_atividadeId_key" ON "sala_atividades"("salaId", "atividadeId");

-- AddForeignKey
ALTER TABLE "sala_atividades" ADD CONSTRAINT "sala_atividades_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "salas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sala_atividades" ADD CONSTRAINT "sala_atividades_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
