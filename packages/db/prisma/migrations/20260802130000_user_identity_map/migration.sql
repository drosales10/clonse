-- Additive identity mapping for legacy users. No legacy tables or rows are touched.
-- No mappings are inserted; legacyUserId must be positive at import time.
CREATE TABLE "user_identity_maps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "source_table" TEXT NOT NULL,
    "legacy_user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reason_code" TEXT,
    "canonical_user_id" TEXT,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_identity_maps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_identity_maps_source_system_source_table_legacy_user_id_key" ON "user_identity_maps"("source_system", "source_table", "legacy_user_id");
CREATE UNIQUE INDEX "user_identity_maps_user_id_source_system_source_table_key" ON "user_identity_maps"("user_id", "source_system", "source_table");
CREATE INDEX "user_identity_maps_user_id_status_idx" ON "user_identity_maps"("user_id", "status");
CREATE INDEX "user_identity_maps_status_reason_code_idx" ON "user_identity_maps"("status", "reason_code");

ALTER TABLE "user_identity_maps" ADD CONSTRAINT "user_identity_maps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_identity_maps" ADD CONSTRAINT "user_identity_maps_canonical_user_id_fkey" FOREIGN KEY ("canonical_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
