-- Event catalog visibility (expand-only). Align previously searchable events as visible.

ALTER TABLE "events" ADD COLUMN "catalog_visible" BOOLEAN NOT NULL DEFAULT false;

UPDATE "events" SET "catalog_visible" = true WHERE "searchable" = true;

CREATE INDEX "events_searchable_catalog_visible_starts_at_idx" ON "events"("searchable", "catalog_visible", "starts_at");
