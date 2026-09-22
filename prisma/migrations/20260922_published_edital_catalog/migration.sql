-- Catálogo oficial de editais publicados (fonte da verdade do catálogo)
CREATE TABLE "PublishedEdital" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "uf" TEXT,
    "careerId" TEXT,
    "year" INTEGER,
    "editalNumber" TEXT,
    "board" TEXT,
    "cargoPretendido" TEXT,
    "logoUrl" TEXT,
    "sourceHash" TEXT,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishedEdital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublishedEdital_status_idx" ON "PublishedEdital"("status");

-- CreateIndex
CREATE INDEX "PublishedEdital_careerId_idx" ON "PublishedEdital"("careerId");

-- CreateIndex
CREATE INDEX "PublishedEdital_uf_idx" ON "PublishedEdital"("uf");
