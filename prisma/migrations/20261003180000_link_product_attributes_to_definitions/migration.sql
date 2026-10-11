-- Los atributos de producto conservan una instantánea de sus datos para que
-- cambios posteriores del catálogo no modifiquen descripciones ni valores
-- históricos. El vínculo opcional permite conocer su estado maestro.
ALTER TABLE "ProductAttribute"
ADD COLUMN "attributeDefinitionId" TEXT;

CREATE INDEX "ProductAttribute_attributeDefinitionId_idx"
ON "ProductAttribute"("attributeDefinitionId");

ALTER TABLE "ProductAttribute"
ADD CONSTRAINT "ProductAttribute_attributeDefinitionId_fkey"
FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Relaciona productos existentes únicamente cuando la asociación de su
-- categoría o subcategoría identifica inequívocamente la misma definición.
UPDATE "ProductAttribute" AS product_attribute
SET "attributeDefinitionId" = source."attributeDefinitionId"
FROM (
  SELECT DISTINCT ON (product_attribute."id")
    product_attribute."id",
    COALESCE(subcategory_attribute."attributeDefinitionId", category_attribute."attributeDefinitionId") AS "attributeDefinitionId"
  FROM "ProductAttribute" AS product_attribute
  INNER JOIN "Product" AS product ON product."id" = product_attribute."productId"
  LEFT JOIN "SubcategoryAttribute" AS subcategory_attribute
    ON subcategory_attribute."subcategoryId" = product."subcategoryId"
    AND subcategory_attribute."name" = product_attribute."name"
  LEFT JOIN "CategoryAttribute" AS category_attribute
    ON category_attribute."categoryId" = product."categoryId"
    AND category_attribute."name" = product_attribute."name"
  WHERE COALESCE(subcategory_attribute."attributeDefinitionId", category_attribute."attributeDefinitionId") IS NOT NULL
  ORDER BY product_attribute."id", subcategory_attribute."attributeDefinitionId" NULLS LAST, category_attribute."attributeDefinitionId" NULLS LAST
) AS source
WHERE product_attribute."id" = source."id";
