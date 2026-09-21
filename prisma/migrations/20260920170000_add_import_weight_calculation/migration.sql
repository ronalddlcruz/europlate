-- La configuración global se replica como una propiedad explícita del
-- atributo del producto. Así una edición posterior del catálogo no altera
-- la configuración histórica de productos ya creados.
ALTER TABLE "AttributeDefinition" ADD COLUMN "isWeight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductAttribute" ADD COLUMN "isWeight" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "ImportCalculationType" AS ENUM ('STANDARD', 'WEIGHT_BASED');

ALTER TABLE "ImportItem"
  ADD COLUMN "calculationType" "ImportCalculationType" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "weightAttributeId" TEXT,
  ADD COLUMN "weightValue" DECIMAL(14,3),
  ADD COLUMN "weightUnit" TEXT,
  ADD COLUMN "subtotalUsd" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Las importaciones existentes conservan exactamente su cálculo estándar.
UPDATE "ImportItem"
SET "subtotalUsd" = ROUND("quantity" * "unitCostUsd", 2)
WHERE "subtotalUsd" = 0;

-- Un producto solo puede tener un atributo marcado como peso.
CREATE UNIQUE INDEX "ProductAttribute_one_weight_per_product"
  ON "ProductAttribute" ("productId")
  WHERE "isWeight" = true;
