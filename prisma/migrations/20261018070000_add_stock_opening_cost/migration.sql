ALTER TABLE "Stock"
ADD COLUMN "openingUnitCostPen" DECIMAL(14,4),
ADD COLUMN "openingUnitCostUsd" DECIMAL(14,4),
ADD COLUMN "openingUnitCostCurrency" TEXT NOT NULL DEFAULT 'PEN';
