INSERT INTO "Permission" ("id", "key", "module", "action")
VALUES
  (md5('products.read'), 'products.read', 'products', 'read'), (md5('products.manage'), 'products.manage', 'products', 'manage'),
  (md5('suppliers.read'), 'suppliers.read', 'suppliers', 'read'), (md5('suppliers.manage'), 'suppliers.manage', 'suppliers', 'manage'),
  (md5('customs_agents.read'), 'customs_agents.read', 'customs_agents', 'read'), (md5('customs_agents.manage'), 'customs_agents.manage', 'customs_agents', 'manage'),
  (md5('purchases.read'), 'purchases.read', 'purchases', 'read'), (md5('purchases.manage'), 'purchases.manage', 'purchases', 'manage'),
  (md5('imports.read'), 'imports.read', 'imports', 'read'), (md5('imports.manage'), 'imports.manage', 'imports', 'manage'),
  (md5('production.read'), 'production.read', 'production', 'read'), (md5('production.manage'), 'production.manage', 'production', 'manage'),
  (md5('inventory.read'), 'inventory.read', 'inventory', 'read'), (md5('inventory.manage'), 'inventory.manage', 'inventory', 'manage'),
  (md5('users.read'), 'users.read', 'users', 'read'), (md5('users.manage'), 'users.manage', 'users', 'manage'),
  (md5('dashboard.read'), 'dashboard.read', 'dashboard', 'read'), (md5('reports.read'), 'reports.read', 'reports', 'read'),
  (md5('settings.read'), 'settings.read', 'settings', 'read'), (md5('settings.manage'), 'settings.manage', 'settings', 'manage')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE (role."key" = 'vendedor' AND permission."key" IN ('products.read', 'suppliers.read', 'customs_agents.read', 'inventory.read', 'dashboard.read'))
   OR (role."key" = 'operador' AND permission."key" IN ('production.read', 'production.manage', 'inventory.read', 'dashboard.read'))
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
