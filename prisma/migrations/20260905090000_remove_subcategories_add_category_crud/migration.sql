ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_subcategoryId_fkey";
DROP INDEX IF EXISTS "Subcategory_categoryId_name_key";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "subcategoryId";
DROP TABLE IF EXISTS "Subcategory";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
