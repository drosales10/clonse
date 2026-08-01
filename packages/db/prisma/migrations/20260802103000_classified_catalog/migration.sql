-- Additive native classified catalog. No legacy tables or rows are touched.
CREATE TABLE "classified_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "classified_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "classifieds" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 63,
    "views" INTEGER NOT NULL DEFAULT 0,
    "total_comments" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "classifieds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "classified_categories_legacy_id_key" ON "classified_categories"("legacy_id");
CREATE UNIQUE INDEX "classifieds_legacy_id_key" ON "classifieds"("legacy_id");
CREATE UNIQUE INDEX "classifieds_slug_key" ON "classifieds"("slug");
CREATE INDEX "classified_categories_parent_id_sort_order_idx" ON "classified_categories"("parent_id", "sort_order");
CREATE INDEX "classified_categories_active_sort_order_idx" ON "classified_categories"("active", "sort_order");
CREATE INDEX "classifieds_owner_id_category_id_idx" ON "classifieds"("owner_id", "category_id");
CREATE INDEX "classifieds_category_id_searchable_created_at_idx" ON "classifieds"("category_id", "searchable", "created_at");
CREATE INDEX "classifieds_searchable_created_at_idx" ON "classifieds"("searchable", "created_at");

ALTER TABLE "classified_categories" ADD CONSTRAINT "classified_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "classified_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "classifieds" ADD CONSTRAINT "classifieds_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classifieds" ADD CONSTRAINT "classifieds_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "classified_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
