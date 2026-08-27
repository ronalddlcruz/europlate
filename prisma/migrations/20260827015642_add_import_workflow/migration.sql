-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "InventoryMovementType" ADD VALUE 'IMPORT_RECEIPT';

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "customsAgentId" TEXT,
    "number" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "duaNumber" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'RECEIVED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "arrivalDate" TIMESTAMP(3),
    "customsCostUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "customsCostPen" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportItem" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCostUsd" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "ImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDocument" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "storageKey" TEXT,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Import_number_key" ON "Import"("number");

-- CreateIndex
CREATE INDEX "Import_companyId_status_createdAt_idx" ON "Import"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Import_supplierId_idx" ON "Import"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Import_companyId_duaNumber_key" ON "Import"("companyId", "duaNumber");

-- CreateIndex
CREATE INDEX "ImportItem_importId_idx" ON "ImportItem"("importId");

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_customsAgentId_fkey" FOREIGN KEY ("customsAgentId") REFERENCES "CustomsAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDocument" ADD CONSTRAINT "ImportDocument_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
