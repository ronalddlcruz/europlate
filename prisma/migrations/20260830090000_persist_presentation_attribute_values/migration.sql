-- Preserve the values entered for each presentation attribute (e.g. width, grammage).
ALTER TABLE "ProductPresentation" ADD COLUMN "attributeValues" JSONB;
