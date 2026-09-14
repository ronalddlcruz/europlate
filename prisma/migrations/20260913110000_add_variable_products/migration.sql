ALTER TABLE "Product"
  ADD COLUMN "isVariable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceVariableProductId" TEXT;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_sourceVariableProductId_fkey"
  FOREIGN KEY ("sourceVariableProductId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_sourceVariableProductId_idx" ON "Product"("sourceVariableProductId");
