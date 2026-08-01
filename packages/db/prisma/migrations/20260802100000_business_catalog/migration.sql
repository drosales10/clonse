-- Additive native business catalog. No legacy tables or rows are touched.
CREATE TABLE "business_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 63,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weighted_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "total_comments" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_categories_legacy_id_key" ON "business_categories"("legacy_id");
CREATE UNIQUE INDEX "businesses_legacy_id_key" ON "businesses"("legacy_id");
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
CREATE INDEX "business_categories_parent_id_sort_order_idx" ON "business_categories"("parent_id", "sort_order");
CREATE INDEX "business_categories_active_sort_order_idx" ON "business_categories"("active", "sort_order");
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");
CREATE INDEX "businesses_category_id_searchable_approved_at_expires_at_idx" ON "businesses"("category_id", "searchable", "approved_at", "expires_at");
CREATE INDEX "businesses_searchable_approved_at_expires_at_created_at_idx" ON "businesses"("searchable", "approved_at", "expires_at", "created_at");

ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
