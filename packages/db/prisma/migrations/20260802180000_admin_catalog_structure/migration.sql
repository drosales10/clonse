-- Additive structure-only catalogs for legacy admin levels, subnetworks,
-- language variables, and non-sensitive global settings.
-- No legacy rows, secrets, imports, or User foreign keys are added.
CREATE TABLE "user_levels" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_signup" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subnetworks" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "name_legacy_id" INTEGER NOT NULL DEFAULT 0,
    "field1_qualifier" TEXT NOT NULL DEFAULT '',
    "field1_value" TEXT NOT NULL DEFAULT '',
    "field2_qualifier" TEXT NOT NULL DEFAULT '',
    "field2_value" TEXT NOT NULL DEFAULT '',
    "theme_legacy_id" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subnetworks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "language_variables" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,
    "value" TEXT,
    "default_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "language_variables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "key" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '',
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "url_enabled" BOOLEAN NOT NULL DEFAULT false,
    "username_enabled" BOOLEAN NOT NULL DEFAULT true,
    "subnet_field1_id" INTEGER NOT NULL DEFAULT -2,
    "subnet_field2_id" INTEGER NOT NULL DEFAULT -2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_levels_legacy_id_key" ON "user_levels"("legacy_id");
CREATE INDEX "user_levels_is_default_idx" ON "user_levels"("is_default");
CREATE INDEX "user_levels_is_signup_idx" ON "user_levels"("is_signup");

CREATE UNIQUE INDEX "subnetworks_legacy_id_key" ON "subnetworks"("legacy_id");
CREATE INDEX "subnetworks_name_legacy_id_idx" ON "subnetworks"("name_legacy_id");
CREATE INDEX "subnetworks_theme_legacy_id_idx" ON "subnetworks"("theme_legacy_id");

CREATE UNIQUE INDEX "language_variables_legacy_id_language_id_key" ON "language_variables"("legacy_id", "language_id");
CREATE INDEX "language_variables_language_id_legacy_id_idx" ON "language_variables"("language_id", "legacy_id");

CREATE UNIQUE INDEX "settings_legacy_id_key" ON "settings"("legacy_id");
CREATE INDEX "settings_key_idx" ON "settings"("key");
