ALTER TABLE "InventoryAdjustment" ADD COLUMN "customerId" TEXT;

CREATE INDEX "InventoryAdjustment_customerId_idx" ON "InventoryAdjustment"("customerId");

ALTER TABLE "InventoryAdjustment"
ADD CONSTRAINT "InventoryAdjustment_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
