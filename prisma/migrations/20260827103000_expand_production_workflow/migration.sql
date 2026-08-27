-- Extend production orders with tenant ownership, output details and material traceability.
CREATE TYPE "ProductionMaterialStatus" AS ENUM ('RESERVED', 'CONSUMED');

ALTER TABLE "ProductionOrder"
  ADD COLUMN "companyId" TEXT,
  ADD COLUMN "presentationId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "outputDispatched" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "outputJustification" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3);

-- Legacy prototype rows, if present, belong to the first configured company and
-- receive the first compatible presentation and warehouse. New records always
-- provide these values explicitly through the API.
UPDATE "ProductionOrder" AS "order"
SET
  "companyId" = (SELECT "id" FROM "Company" ORDER BY "createdAt" ASC LIMIT 1),
  "presentationId" = (SELECT "id" FROM "ProductPresentation" WHERE "productId" = "order"."productId" ORDER BY "id" ASC LIMIT 1),
  "warehouseId" = (SELECT "id" FROM "Warehouse" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "companyId" IS NULL;

ALTER TABLE "ProductionMaterial"
  ADD COLUMN "presentationId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "status" "ProductionMaterialStatus" NOT NULL DEFAULT 'RESERVED',
  ADD COLUMN "immediateConsumption" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consumedAt" TIMESTAMP(3);

UPDATE "ProductionMaterial" AS "material"
SET
  "presentationId" = (SELECT "id" FROM "ProductPresentation" WHERE "productId" = "material"."productId" ORDER BY "id" ASC LIMIT 1),
  "warehouseId" = (SELECT "warehouseId" FROM "ProductionOrder" WHERE "id" = "material"."orderId")
WHERE "warehouseId" IS NULL;

ALTER TABLE "ProductionOrder"
  ALTER COLUMN "companyId" SET NOT NULL,
  ALTER COLUMN "presentationId" SET NOT NULL,
  ALTER COLUMN "warehouseId" SET NOT NULL;

ALTER TABLE "ProductionMaterial"
  ALTER COLUMN "presentationId" SET NOT NULL,
  ALTER COLUMN "warehouseId" SET NOT NULL;

CREATE INDEX "ProductionOrder_companyId_status_scheduledAt_idx" ON "ProductionOrder"("companyId", "status", "scheduledAt");
CREATE INDEX "ProductionOrder_warehouseId_idx" ON "ProductionOrder"("warehouseId");
CREATE INDEX "ProductionMaterial_orderId_status_idx" ON "ProductionMaterial"("orderId", "status");
CREATE INDEX "ProductionMaterial_warehouseId_idx" ON "ProductionMaterial"("warehouseId");

ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionMaterial" ADD CONSTRAINT "ProductionMaterial_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionMaterial" ADD CONSTRAINT "ProductionMaterial_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
