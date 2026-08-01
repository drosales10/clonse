-- Additive native event catalog. No legacy tables or rows are touched.
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "host" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 64,
    "invite_only" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_categories_legacy_id_key" ON "event_categories"("legacy_id");
CREATE UNIQUE INDEX "events_legacy_id_key" ON "events"("legacy_id");
CREATE INDEX "event_categories_parent_id_sort_order_idx" ON "event_categories"("parent_id", "sort_order");
CREATE INDEX "event_categories_active_sort_order_idx" ON "event_categories"("active", "sort_order");
CREATE INDEX "events_owner_id_idx" ON "events"("owner_id");
CREATE INDEX "events_category_id_searchable_starts_at_idx" ON "events"("category_id", "searchable", "starts_at");
CREATE INDEX "events_searchable_starts_at_idx" ON "events"("searchable", "starts_at");

ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
