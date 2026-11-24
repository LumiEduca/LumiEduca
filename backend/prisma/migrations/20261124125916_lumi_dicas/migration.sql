-- CreateTable
CREATE TABLE "lumi_dicas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "questaoId" TEXT,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lumi_dicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lumi_dicas_alunoId_criadaEm_idx" ON "lumi_dicas"("alunoId", "criadaEm");

-- AddForeignKey
ALTER TABLE "lumi_dicas" ADD CONSTRAINT "lumi_dicas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lumi_dicas" ADD CONSTRAINT "lumi_dicas_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
