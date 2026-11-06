BEGIN;

ALTER TABLE "InventoryMovement"
  ADD COLUMN "openingUnitCostPen" DECIMAL(14,4),
  ADD COLUMN "openingUnitCostUsd" DECIMAL(14,4),
  ADD COLUMN "openingUnitCostCurrency" TEXT;

INSERT INTO "Permission" ("id", "key", "module", "action")
VALUES (md5('inventory.opening.manage'), 'inventory.opening.manage', 'inventory', 'opening.manage')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role CROSS JOIN "Permission" permission
WHERE role."key" IN ('admin', 'general_manager', 'branch_admin', 'warehouse_manager')
  AND permission."key" = 'inventory.opening.manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- La asignación operativa de Lenin corresponde a sus dos tiendas.
DELETE FROM "UserWarehouse" assignment
USING "User" account, "Warehouse" warehouse
WHERE assignment."userId" = account."id"
  AND assignment."warehouseId" = warehouse."id"
  AND account."email" = 'lenin.jorge.aquino@europlate.com'
  AND warehouse."name" NOT IN ('Av Paramonga 1', 'Av Paramonga 2');

INSERT INTO "UserWarehouse" ("userId", "warehouseId")
SELECT account."id", warehouse."id"
FROM "User" account JOIN "Warehouse" warehouse ON warehouse."companyId" = account."companyId"
WHERE account."email" = 'lenin.jorge.aquino@europlate.com'
  AND warehouse."name" IN ('Av Paramonga 1', 'Av Paramonga 2')
  AND warehouse."status" = 'ACTIVE'
ON CONFLICT ("userId", "warehouseId") DO NOTHING;

UPDATE "Warehouse" warehouse
SET "responsibleUserId" = NULL
FROM "User" account
WHERE warehouse."responsibleUserId" = account."id"
  AND account."email" = 'lenin.jorge.aquino@europlate.com'
  AND warehouse."name" NOT IN ('Av Paramonga 1', 'Av Paramonga 2');

COMMIT;
