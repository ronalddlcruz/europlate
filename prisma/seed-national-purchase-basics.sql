-- La BD desplegada exige IDs explícitos. Se generan CUIDs válidos para las
-- validaciones de compras e importaciones (c + 24 caracteres alfanuméricos).
INSERT INTO "Warehouse" ("id", "companyId", "name", "location", "description", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Almacén principal', 'Sede principal', 'Recepción y almacenamiento general de mercadería.', 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Warehouse" w WHERE w."companyId" = c."id" AND w."name" = 'Almacén principal'
);

INSERT INTO "Warehouse" ("id", "companyId", "name", "location", "description", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Almacén de insumos', 'Zona de recepción', 'Materiales e insumos destinados a producción.', 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Warehouse" w WHERE w."companyId" = c."id" AND w."name" = 'Almacén de insumos'
);

INSERT INTO "Warehouse" ("id", "companyId", "name", "location", "description", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Almacén de productos terminados', 'Zona de despacho', 'Productos listos para venta y despacho.', 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Warehouse" w WHERE w."companyId" = c."id" AND w."name" = 'Almacén de productos terminados'
);

INSERT INTO "Supplier" ("id", "companyId", "name", "taxId", "type", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Distribuidora Nacional S.A.C.', '20100000001', 'NATIONAL'::"SupplierType", 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Supplier" s WHERE s."companyId" = c."id" AND s."taxId" = '20100000001'
);

INSERT INTO "Supplier" ("id", "companyId", "name", "taxId", "type", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Comercial Andina S.R.L.', '20100000002', 'NATIONAL'::"SupplierType", 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Supplier" s WHERE s."companyId" = c."id" AND s."taxId" = '20100000002'
);

INSERT INTO "Supplier" ("id", "companyId", "name", "taxId", "type", "status")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 24), c."id", 'Global Print Supplies Ltd.', 'US-90012345', 'FOREIGN'::"SupplierType", 'ACTIVE'::"ProductStatus"
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "Supplier" s WHERE s."companyId" = c."id" AND s."taxId" = 'US-90012345'
);
