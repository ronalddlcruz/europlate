ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_WASTE';

CREATE TYPE "InventoryAdjustmentType" AS ENUM ('IN', 'OUT', 'WASTE');

ALTER TABLE "ProductPresentation"
  ADD COLUMN "openingUnitCostUsd" DECIMAL(14,4),
  ADD COLUMN "openingUnitCostCurrency" TEXT NOT NULL DEFAULT 'PEN';

ALTER TABLE "InventoryAdjustment"
  ADD COLUMN "type" "InventoryAdjustmentType" NOT NULL DEFAULT 'IN';
