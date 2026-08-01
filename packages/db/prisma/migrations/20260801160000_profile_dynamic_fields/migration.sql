-- Normalized metadata and values for dynamic profile fields.
-- No legacy data is copied here; migration/inventory/04-campos-dinamicos-perfil.md
-- documents the later import and PHP-serialize transformation.
CREATE TABLE "profile_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile_fields" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "category_id" TEXT NOT NULL,
    "parent_field_id" TEXT,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "max_length" INTEGER,
    "options" JSONB,
    "display_mode" INTEGER NOT NULL DEFAULT 1,
    "validation_regex" TEXT,
    "allow_html" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile_field_values" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_field_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_categories_legacy_id_key" ON "profile_categories"("legacy_id");
CREATE UNIQUE INDEX "profile_fields_legacy_id_key" ON "profile_fields"("legacy_id");
CREATE UNIQUE INDEX "profile_fields_field_key_key" ON "profile_fields"("field_key");
CREATE UNIQUE INDEX "profile_field_values_user_id_field_id_key" ON "profile_field_values"("user_id", "field_id");
CREATE INDEX "profile_categories_parent_id_sort_order_idx" ON "profile_categories"("parent_id", "sort_order");
CREATE INDEX "profile_categories_active_sort_order_idx" ON "profile_categories"("active", "sort_order");
CREATE INDEX "profile_fields_category_id_active_sort_order_idx" ON "profile_fields"("category_id", "active", "sort_order");
CREATE INDEX "profile_fields_parent_field_id_idx" ON "profile_fields"("parent_field_id");
CREATE INDEX "profile_field_values_field_id_idx" ON "profile_field_values"("field_id");

ALTER TABLE "profile_categories"
  ADD CONSTRAINT "profile_categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "profile_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "profile_fields"
  ADD CONSTRAINT "profile_fields_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "profile_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_fields"
  ADD CONSTRAINT "profile_fields_parent_field_id_fkey"
  FOREIGN KEY ("parent_field_id") REFERENCES "profile_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "profile_field_values"
  ADD CONSTRAINT "profile_field_values_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_field_values"
  ADD CONSTRAINT "profile_field_values_field_id_fkey"
  FOREIGN KEY ("field_id") REFERENCES "profile_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
