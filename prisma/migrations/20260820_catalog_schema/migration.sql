-- CreateTable
CREATE TABLE "EditalTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "sigla" TEXT,
    "cargo" TEXT NOT NULL,
    "esfera" TEXT NOT NULL DEFAULT 'Federal',
    "banca" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "editalNumero" TEXT,
    "logoUrl" TEXT,
    "logoSourceUrl" TEXT,
    "officialSourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "sourceVersion" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'seguranca_publica',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditalDiscipline" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditalDiscipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditalTopic" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditalTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditalTemplate_slug_key" ON "EditalTemplate"("slug");

-- CreateIndex
CREATE INDEX "EditalTemplate_slug_idx" ON "EditalTemplate"("slug");

-- CreateIndex
CREATE INDEX "EditalTemplate_orgao_idx" ON "EditalTemplate"("orgao");

-- CreateIndex
CREATE INDEX "EditalTemplate_banca_idx" ON "EditalTemplate"("banca");

-- CreateIndex
CREATE INDEX "EditalTemplate_esfera_idx" ON "EditalTemplate"("esfera");

-- CreateIndex
CREATE INDEX "EditalTemplate_category_idx" ON "EditalTemplate"("category");

-- CreateIndex
CREATE INDEX "EditalDiscipline_templateId_idx" ON "EditalDiscipline"("templateId");

-- CreateIndex
CREATE INDEX "EditalTopic_disciplineId_idx" ON "EditalTopic"("disciplineId");

-- CreateIndex
CREATE INDEX "EditalTopic_parentId_idx" ON "EditalTopic"("parentId");

-- AddForeignKey
ALTER TABLE "EditalDiscipline" ADD CONSTRAINT "EditalDiscipline_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EditalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalTopic" ADD CONSTRAINT "EditalTopic_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "EditalDiscipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditalTopic" ADD CONSTRAINT "EditalTopic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EditalTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

