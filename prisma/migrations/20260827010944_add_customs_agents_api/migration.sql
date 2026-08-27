-- CreateTable
CREATE TABLE "CustomsAgent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomsAgent_companyId_name_idx" ON "CustomsAgent"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomsAgent_companyId_ruc_key" ON "CustomsAgent"("companyId", "ruc");

-- AddForeignKey
ALTER TABLE "CustomsAgent" ADD CONSTRAINT "CustomsAgent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
