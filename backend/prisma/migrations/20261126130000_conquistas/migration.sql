-- CreateTable
CREATE TABLE "conquistas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_conquistas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "concedidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_codigo_key" ON "conquistas"("codigo");

-- CreateIndex
CREATE INDEX "usuario_conquistas_alunoId_idx" ON "usuario_conquistas"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_conquistas_alunoId_conquistaId_key" ON "usuario_conquistas"("alunoId", "conquistaId");

-- AddForeignKey
ALTER TABLE "usuario_conquistas" ADD CONSTRAINT "usuario_conquistas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_conquistas" ADD CONSTRAINT "usuario_conquistas_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;