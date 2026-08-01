-- Additive native blog catalog. No legacy tables or rows are touched.
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_entries" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "author_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 63,
    "comments_privacy" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "blog_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_categories_legacy_id_key" ON "blog_categories"("legacy_id");
CREATE UNIQUE INDEX "blog_entries_legacy_id_key" ON "blog_entries"("legacy_id");
CREATE INDEX "blog_categories_parent_id_sort_order_idx" ON "blog_categories"("parent_id", "sort_order");
CREATE INDEX "blog_categories_active_sort_order_idx" ON "blog_categories"("active", "sort_order");
CREATE INDEX "blog_entries_author_id_category_id_idx" ON "blog_entries"("author_id", "category_id");
CREATE INDEX "blog_entries_category_id_searchable_created_at_idx" ON "blog_entries"("category_id", "searchable", "created_at");
CREATE INDEX "blog_entries_searchable_created_at_idx" ON "blog_entries"("searchable", "created_at");

ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blog_entries" ADD CONSTRAINT "blog_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blog_entries" ADD CONSTRAINT "blog_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
