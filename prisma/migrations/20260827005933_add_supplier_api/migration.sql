-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('NATIONAL', 'FOREIGN');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "type" "SupplierType" NOT NULL DEFAULT 'NATIONAL';

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
