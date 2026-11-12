-- CreateTable
CREATE TABLE "avaliacoes_demo" (
    "id" TEXT NOT NULL,
    "jogo" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_demo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avaliacoes_demo_jogo_criadaEm_idx" ON "avaliacoes_demo"("jogo", "criadaEm");
