ALTER TABLE "User" ADD COLUMN "siteId" TEXT;

UPDATE "User" AS u
SET "siteId" = assignment."siteId"
FROM (
  SELECT DISTINCT ON (uw."userId") uw."userId", w."siteId"
  FROM "UserWarehouse" uw
  INNER JOIN "Warehouse" w ON w.id = uw."warehouseId"
  ORDER BY uw."userId", uw."assignedAt"
) AS assignment
WHERE u.id = assignment."userId";

UPDATE "User" AS u
SET "siteId" = NULL
WHERE EXISTS (
  SELECT 1
  FROM "UserRole" ur
  INNER JOIN "Role" r ON r.id = ur."roleId"
  WHERE ur."userId" = u.id AND r.key IN ('admin', 'general_manager')
);

CREATE INDEX "User_companyId_siteId_idx" ON "User"("companyId", "siteId");

ALTER TABLE "User"
ADD CONSTRAINT "User_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
