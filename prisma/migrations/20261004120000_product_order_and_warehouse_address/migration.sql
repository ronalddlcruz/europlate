-- Preserva la ubicación visual de los productos. La carga inicial replica el
-- orden alfabético que ya veía el usuario; las altas posteriores quedan al final.
ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC, code ASC, id ASC)::INTEGER AS position
  FROM "Product"
)
UPDATE "Product" AS product
SET "sortOrder" = ordered.position
FROM ordered
WHERE product.id = ordered.id;

CREATE INDEX "Product_sortOrder_idx" ON "Product"("sortOrder");

-- Dirección estructurada y opcional para identificar cada almacén.
ALTER TABLE "Warehouse"
  ADD COLUMN "department" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "district" TEXT,
  ADD COLUMN "address" TEXT;

-- La ubicación antigua se conserva y queda disponible como dirección inicial.
UPDATE "Warehouse"
SET "address" = "location"
WHERE "address" IS NULL AND "location" IS NOT NULL;
