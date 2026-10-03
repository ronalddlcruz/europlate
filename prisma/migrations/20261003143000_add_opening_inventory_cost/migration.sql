-- Costo unitario declarado durante la toma inicial de inventario.
-- Las compras e importaciones posteriores continúan siendo la fuente
-- prioritaria de valorización cuando existan.
ALTER TABLE "ProductPresentation"
  ADD COLUMN "openingUnitCostPen" DECIMAL(14,4);
