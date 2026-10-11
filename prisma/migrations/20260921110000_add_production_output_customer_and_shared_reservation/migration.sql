ALTER TABLE "ProductionOrder" ADD COLUMN "outputCustomerId" TEXT;
ALTER TABLE "ProductionMaterial" ADD COLUMN "shareReservation" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ProductionOrder_outputCustomerId_idx" ON "ProductionOrder"("outputCustomerId");

ALTER TABLE "ProductionOrder"
ADD CONSTRAINT "ProductionOrder_outputCustomerId_fkey"
FOREIGN KEY ("outputCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
