-- Producción deja de usar presentación en su contrato y modelo de aplicación.
-- Se conservan las referencias históricas como columnas opcionales para no
-- perder trazabilidad de órdenes anteriores. Una futura migración de archivo
-- podrá retirarlas tras el periodo de retención acordado.
ALTER TABLE "ProductionOrder"
  ALTER COLUMN "presentationId" DROP NOT NULL;

ALTER TABLE "ProductionMaterial"
  ALTER COLUMN "presentationId" DROP NOT NULL;
