-- Add optional level and subnetwork assignment on users (legacy user_level_id / user_subnet_id).
ALTER TABLE "users" ADD COLUMN "level_id" TEXT;
ALTER TABLE "users" ADD COLUMN "subnetwork_id" TEXT;

CREATE INDEX "users_level_id_idx" ON "users"("level_id");
CREATE INDEX "users_subnetwork_id_idx" ON "users"("subnetwork_id");

ALTER TABLE "users" ADD CONSTRAINT "users_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "user_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_subnetwork_id_fkey" FOREIGN KEY ("subnetwork_id") REFERENCES "subnetworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
