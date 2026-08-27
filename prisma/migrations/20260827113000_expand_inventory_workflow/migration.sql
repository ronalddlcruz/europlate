-- Inventory traceability for warehouses, transfers, adjustments and movements.
ALTER TABLE "Warehouse" ADD COLUMN "description" TEXT;

ALTER TABLE "InventoryMovement"
  ADD COLUMN "presentationId" TEXT,
  ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "StockTransfer"
  ADD COLUMN "presentationId" TEXT,
  ADD COLUMN "companyId" TEXT,
  ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "InventoryAdjustment"
  ADD COLUMN "presentationId" TEXT,
  ADD COLUMN "companyId" TEXT,
  ADD COLUMN "createdByUserId" TEXT;

UPDATE "StockTransfer" AS "transfer"
SET "companyId" = origin."companyId"
FROM "Warehouse" AS origin
WHERE origin."id" = "transfer"."fromWarehouseId" AND "transfer"."companyId" IS NULL;

UPDATE "InventoryAdjustment" AS "adjustment"
SET "companyId" = warehouse."companyId"
FROM "Warehouse" AS warehouse
WHERE warehouse."id" = "adjustment"."warehouseId" AND "adjustment"."companyId" IS NULL;

CREATE INDEX "StockTransfer_companyId_createdAt_idx" ON "StockTransfer"("companyId", "createdAt");
CREATE INDEX "InventoryAdjustment_companyId_createdAt_idx" ON "InventoryAdjustment"("companyId", "createdAt");
CREATE INDEX "InventoryMovement_presentationId_idx" ON "InventoryMovement"("presentationId");

ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
