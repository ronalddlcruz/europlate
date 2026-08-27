-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "immediateConsumption" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "useInSubtotal" BOOLEAN NOT NULL DEFAULT false;
