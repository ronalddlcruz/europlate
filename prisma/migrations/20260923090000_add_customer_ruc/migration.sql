ALTER TABLE "Customer" ADD COLUMN "ruc" TEXT;

CREATE UNIQUE INDEX "Customer_companyId_ruc_key" ON "Customer"("companyId", "ruc");
