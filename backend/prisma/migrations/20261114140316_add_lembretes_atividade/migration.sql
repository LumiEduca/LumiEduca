-- CreateTable
CREATE TABLE "lembretes_atividade" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembretes_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lembretes_atividade_alunoId_atividadeId_key" ON "lembretes_atividade"("alunoId", "atividadeId");

-- AddForeignKey
ALTER TABLE "lembretes_atividade" ADD CONSTRAINT "lembretes_atividade_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes_atividade" ADD CONSTRAINT "lembretes_atividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
