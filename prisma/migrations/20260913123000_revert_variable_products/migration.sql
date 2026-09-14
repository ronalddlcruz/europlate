-- Reverts the short-lived variable-product extension.
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_sourceVariableProductId_fkey";
DROP INDEX IF EXISTS "Product_sourceVariableProductId_idx";
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "sourceVariableProductId",
  DROP COLUMN IF EXISTS "isVariable";
