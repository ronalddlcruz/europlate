BEGIN;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."key" IN ('branch_admin', 'warehouse_manager', 'vendedor', 'operador')
  AND permission."key" = 'operations.scoped'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Conserva la asignación operativa solicitada después de la migración de main.
DELETE FROM "UserRole"
WHERE "userId" IN (
  SELECT "id" FROM "User"
  WHERE "email" IN (
    'ronald.delacruz@europlate.pe',
    'sebastian.mercado@europlate.pe',
    'lenin.jorge.aquino@europlate.com'
  )
);

INSERT INTO "UserRole" ("userId", "roleId")
SELECT user_record."id", role."id"
FROM "User" user_record
JOIN "Role" role ON role."key" = CASE
  WHEN user_record."email" = 'ronald.delacruz@europlate.pe' THEN 'general_manager'
  ELSE 'branch_admin'
END
WHERE user_record."email" IN (
  'ronald.delacruz@europlate.pe',
  'sebastian.mercado@europlate.pe',
  'lenin.jorge.aquino@europlate.com'
)
ON CONFLICT ("userId", "roleId") DO NOTHING;

UPDATE "User" user_record
SET "siteId" = CASE
  WHEN user_record."email" = 'ronald.delacruz@europlate.pe' THEN NULL
  ELSE (
    SELECT site."id" FROM "Site" site
    WHERE site."companyId" = user_record."companyId" AND lower(site."name") = 'lima'
    LIMIT 1
  )
END
WHERE user_record."email" IN (
  'ronald.delacruz@europlate.pe',
  'sebastian.mercado@europlate.pe',
  'lenin.jorge.aquino@europlate.com'
);

DELETE FROM "UserWarehouse"
WHERE "userId" IN (
  SELECT "id" FROM "User"
  WHERE "email" IN (
    'ronald.delacruz@europlate.pe',
    'sebastian.mercado@europlate.pe',
    'lenin.jorge.aquino@europlate.com'
  )
);

INSERT INTO "UserWarehouse" ("userId", "warehouseId")
SELECT user_record."id", warehouse."id"
FROM "User" user_record
JOIN "Site" site
  ON site."companyId" = user_record."companyId" AND lower(site."name") = 'lima'
JOIN "Warehouse" warehouse
  ON warehouse."companyId" = user_record."companyId" AND warehouse."siteId" = site."id"
WHERE user_record."email" IN (
  'sebastian.mercado@europlate.pe',
  'lenin.jorge.aquino@europlate.com'
)
  AND warehouse."status" = 'ACTIVE'
ON CONFLICT ("userId", "warehouseId") DO NOTHING;

COMMIT;
