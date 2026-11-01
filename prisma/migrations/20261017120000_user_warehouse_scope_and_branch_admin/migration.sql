CREATE TABLE "UserWarehouse" (
  "userId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserWarehouse_pkey" PRIMARY KEY ("userId", "warehouseId")
);

ALTER TABLE "UserWarehouse" ADD CONSTRAINT "UserWarehouse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWarehouse" ADD CONSTRAINT "UserWarehouse_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "UserWarehouse_warehouseId_idx" ON "UserWarehouse"("warehouseId");

-- Conserva el alcance que ya estaba representado por la responsabilidad del almacén.
INSERT INTO "UserWarehouse" ("userId", "warehouseId")
SELECT "responsibleUserId", "id" FROM "Warehouse" WHERE "responsibleUserId" IS NOT NULL
ON CONFLICT ("userId", "warehouseId") DO NOTHING;

UPDATE "Role" SET "name" = 'Administrador del sistema' WHERE "key" = 'admin';

INSERT INTO "Role" ("id", "key", "name") VALUES
  (md5('branch_admin'), 'branch_admin', 'Administrador de sede')
ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name";

-- Los perfiles se normalizan según responsabilidades reales. El administrador
-- del sistema continúa recibiendo acceso total mediante la lógica de sesión.
DELETE FROM "RolePermission"
WHERE "roleId" IN (SELECT "id" FROM "Role" WHERE "key" IN (
  'general_manager', 'branch_admin', 'warehouse_manager', 'vendedor', 'operador'
));

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role CROSS JOIN "Permission" permission
WHERE
  role."key" = 'general_manager'
  OR (role."key" = 'branch_admin' AND permission."key" IN (
    'dashboard.read', 'products.read', 'suppliers.read', 'customers.read',
    'customs_agents.read', 'purchases.read', 'purchases.manage', 'imports.read',
    'imports.manage', 'production.read', 'production.manage', 'inventory.read',
    'inventory.manage', 'reports.read'
  ))
  OR (role."key" = 'warehouse_manager' AND permission."key" IN (
    'dashboard.read', 'products.read', 'purchases.read', 'imports.read',
    'production.read', 'inventory.read', 'inventory.manage', 'reports.read'
  ))
  OR (role."key" = 'vendedor' AND permission."key" IN (
    'dashboard.read', 'products.read', 'customers.read', 'customers.manage', 'inventory.read'
  ))
  OR (role."key" = 'operador' AND permission."key" IN (
    'dashboard.read', 'products.read', 'production.read', 'production.manage', 'inventory.read'
  ))
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
