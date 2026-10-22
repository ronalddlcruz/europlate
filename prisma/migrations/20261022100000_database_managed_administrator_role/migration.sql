BEGIN;

-- Un solo rol administrador reutilizable; no se duplica el rol existente.
INSERT INTO "Role" ("id", "key", "name")
VALUES (md5('admin'), 'admin', 'Administrador')
ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name";

-- El alcance global también es un permiso de la base, no una excepción por rol.
INSERT INTO "Permission" ("id", "key", "module", "action")
VALUES
  (md5('operations.global'), 'operations.global', 'operations', 'global'),
  (md5('operations.scoped'), 'operations.scoped', 'operations', 'scoped')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."key" = 'admin'
   OR (role."key" = 'general_manager' AND permission."key" = 'operations.global')
   OR (role."key" = 'warehouse_manager' AND permission."key" = 'operations.scoped')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Provisión de datos solicitada: Lenin queda con el rol Administrador, sin
-- alterar el rol compartido "branch_admin" que usan otros colaboradores.
INSERT INTO "UserRole" ("userId", "roleId")
SELECT user_record."id", role."id"
FROM "User" user_record
CROSS JOIN "Role" role
WHERE user_record."email" = 'lenin.jorge.aquino@europlate.com'
  AND role."key" = 'admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;

DELETE FROM "UserRole" assignment
USING "User" user_record, "Role" role
WHERE assignment."userId" = user_record."id"
  AND assignment."roleId" = role."id"
  AND user_record."email" = 'lenin.jorge.aquino@europlate.com'
  AND role."key" = 'branch_admin';

COMMIT;
