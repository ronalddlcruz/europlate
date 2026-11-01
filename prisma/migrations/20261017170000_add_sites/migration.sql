CREATE TABLE "Site" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Site_companyId_name_key" ON "Site"("companyId", "name");
CREATE INDEX "Site_companyId_status_idx" ON "Site"("companyId", "status");
ALTER TABLE "Site" ADD CONSTRAINT "Site_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Site" ("id", "companyId", "name", "updatedAt")
SELECT md5(company."id" || ':lima'), company."id", 'Lima', CURRENT_TIMESTAMP FROM "Company" company
UNION ALL
SELECT md5(company."id" || ':trujillo'), company."id", 'Trujillo', CURRENT_TIMESTAMP FROM "Company" company
ON CONFLICT ("companyId", "name") DO NOTHING;

ALTER TABLE "Warehouse" ADD COLUMN "siteId" TEXT;

UPDATE "Warehouse" warehouse
SET "siteId" = site."id"
FROM "Site" site
WHERE site."companyId" = warehouse."companyId"
  AND site."name" = CASE
    WHEN concat_ws(' ', warehouse."name", warehouse."location", warehouse."department", warehouse."province", warehouse."district", warehouse."address") ILIKE '%trujillo%'
      THEN 'Trujillo'
    ELSE 'Lima'
  END;

ALTER TABLE "Warehouse" ALTER COLUMN "siteId" SET NOT NULL;
CREATE INDEX "Warehouse_companyId_siteId_idx" ON "Warehouse"("companyId", "siteId");
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
