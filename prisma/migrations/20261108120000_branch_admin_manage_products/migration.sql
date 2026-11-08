-- El administrador de sede puede crear y editar el catálogo general. El
-- alcance del stock inicial sigue limitado por UserWarehouse.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."key" = 'branch_admin'
  AND permission."key" = 'products.manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
