-- Catálogo global de atributos reutilizables.
CREATE TABLE "AttributeDefinition" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dataType" "AttributeDataType" NOT NULL DEFAULT 'TEXT',
  "suffix" TEXT,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttributeDefinition_code_key" ON "AttributeDefinition"("code");
CREATE UNIQUE INDEX "AttributeDefinition_name_key" ON "AttributeDefinition"("name");
CREATE INDEX "AttributeDefinition_name_status_idx" ON "AttributeDefinition"("name", "status");

ALTER TABLE "CategoryAttribute" ADD COLUMN "attributeDefinitionId" TEXT;
ALTER TABLE "SubcategoryAttribute" ADD COLUMN "attributeDefinitionId" TEXT;

ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubcategoryAttribute" ADD CONSTRAINT "SubcategoryAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
