-- Additive native group catalog. No legacy tables or rows are touched.
-- catalog_visible remains false until a validated visibility transform exists.
CREATE TABLE "group_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 0,
    "catalog_visible" BOOLEAN NOT NULL DEFAULT false,
    "comments_privacy" INTEGER,
    "discussion_privacy" INTEGER,
    "invite_enabled" BOOLEAN NOT NULL DEFAULT false,
    "upload_enabled" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_categories_legacy_id_key" ON "group_categories"("legacy_id");
CREATE UNIQUE INDEX "groups_legacy_id_key" ON "groups"("legacy_id");
CREATE INDEX "group_categories_parent_id_sort_order_idx" ON "group_categories"("parent_id", "sort_order");
CREATE INDEX "group_categories_active_sort_order_idx" ON "group_categories"("active", "sort_order");
CREATE INDEX "groups_owner_id_idx" ON "groups"("owner_id");
CREATE INDEX "groups_category_id_searchable_catalog_visible_idx" ON "groups"("category_id", "searchable", "catalog_visible");
CREATE INDEX "groups_searchable_catalog_visible_created_at_idx" ON "groups"("searchable", "catalog_visible", "created_at");

ALTER TABLE "group_categories" ADD CONSTRAINT "group_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "group_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "group_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
