ALTER TABLE "Warehouse" ADD COLUMN "responsibleUserId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Import" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "ProductionOrder" ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Import" ADD CONSTRAINT "Import_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Warehouse_companyId_responsibleUserId_idx" ON "Warehouse"("companyId", "responsibleUserId");
CREATE INDEX "Purchase_companyId_createdByUserId_purchaseDate_idx" ON "Purchase"("companyId", "createdByUserId", "purchaseDate");
CREATE INDEX "Import_companyId_createdByUserId_arrivalDate_idx" ON "Import"("companyId", "createdByUserId", "arrivalDate");
CREATE INDEX "ProductionOrder_companyId_createdByUserId_scheduledAt_idx" ON "ProductionOrder"("companyId", "createdByUserId", "scheduledAt");

INSERT INTO "Role" ("id", "key", "name") VALUES
  (md5('general_manager'), 'general_manager', 'Gerente General'),
  (md5('warehouse_manager'), 'warehouse_manager', 'Responsable de Almacén')
ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role CROSS JOIN "Permission" permission
WHERE (role."key" = 'general_manager' AND permission."key" IN (
  'products.read', 'suppliers.read', 'customers.read', 'customs_agents.read', 'purchases.read',
  'imports.read', 'production.read', 'inventory.read', 'users.read',
  'dashboard.read', 'reports.read', 'settings.read'
)) OR (role."key" = 'warehouse_manager' AND permission."key" IN (
  'products.read', 'suppliers.read', 'customers.read', 'customs_agents.read',
  'purchases.read', 'purchases.manage', 'imports.read', 'imports.manage',
  'production.read', 'production.manage', 'inventory.read', 'inventory.manage',
  'dashboard.read', 'reports.read', 'settings.read'
))
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
