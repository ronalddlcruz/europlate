-- La categoría se convierte en una definición reutilizable de catálogo.
ALTER TABLE "Category"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

CREATE TABLE "CategoryAttribute" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dataType" "AttributeDataType" NOT NULL DEFAULT 'TEXT',
  "suffix" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subcategory" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubcategoryAttribute" (
  "id" TEXT NOT NULL,
  "subcategoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dataType" "AttributeDataType" NOT NULL DEFAULT 'TEXT',
  "suffix" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubcategoryAttribute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "subcategoryId" TEXT;

CREATE UNIQUE INDEX "CategoryAttribute_categoryId_name_key" ON "CategoryAttribute"("categoryId", "name");
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");
CREATE UNIQUE INDEX "Subcategory_categoryId_code_key" ON "Subcategory"("categoryId", "code");
CREATE UNIQUE INDEX "SubcategoryAttribute_subcategoryId_name_key" ON "SubcategoryAttribute"("subcategoryId", "name");

ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubcategoryAttribute" ADD CONSTRAINT "SubcategoryAttribute_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
