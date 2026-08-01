-- Additive native article catalog. No legacy tables or rows are touched.
CREATE TABLE "article_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "author_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "privacy" INTEGER NOT NULL DEFAULT 0,
    "comments_privacy" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "article_categories_legacy_id_key" ON "article_categories"("legacy_id");
CREATE UNIQUE INDEX "articles_legacy_id_key" ON "articles"("legacy_id");
CREATE INDEX "article_categories_parent_id_sort_order_idx" ON "article_categories"("parent_id", "sort_order");
CREATE INDEX "article_categories_active_sort_order_idx" ON "article_categories"("active", "sort_order");
CREATE INDEX "articles_author_id_category_id_idx" ON "articles"("author_id", "category_id");
CREATE INDEX "articles_category_id_approved_draft_searchable_published_at_idx" ON "articles"("category_id", "approved", "draft", "searchable", "published_at");
CREATE INDEX "articles_approved_draft_searchable_published_at_idx" ON "articles"("approved", "draft", "searchable", "published_at");
CREATE INDEX "articles_featured_approved_draft_searchable_idx" ON "articles"("featured", "approved", "draft", "searchable");

ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "article_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
