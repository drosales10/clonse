-- Catalog visibility for remaining content modules (expand-only).

ALTER TABLE "classifieds" ADD COLUMN "catalog_visible" BOOLEAN NOT NULL DEFAULT false;
UPDATE "classifieds" SET "catalog_visible" = true WHERE "searchable" = true;

ALTER TABLE "blog_entries" ADD COLUMN "catalog_visible" BOOLEAN NOT NULL DEFAULT false;
UPDATE "blog_entries" SET "catalog_visible" = true WHERE "searchable" = true;

ALTER TABLE "businesses" ADD COLUMN "catalog_visible" BOOLEAN NOT NULL DEFAULT false;
UPDATE "businesses" SET "catalog_visible" = true WHERE "searchable" = true AND "approved_at" IS NOT NULL;

ALTER TABLE "articles" ADD COLUMN "catalog_visible" BOOLEAN NOT NULL DEFAULT false;
UPDATE "articles" SET "catalog_visible" = true WHERE "searchable" = true AND "approved" = true AND "draft" = false;

CREATE INDEX "classifieds_searchable_catalog_visible_created_at_idx" ON "classifieds"("searchable", "catalog_visible", "created_at");
CREATE INDEX "blog_entries_searchable_catalog_visible_created_at_idx" ON "blog_entries"("searchable", "catalog_visible", "created_at");
CREATE INDEX "businesses_searchable_catalog_visible_created_at_idx" ON "businesses"("searchable", "catalog_visible", "created_at");
CREATE INDEX "articles_searchable_catalog_visible_published_at_idx" ON "articles"("searchable", "catalog_visible", "published_at");
