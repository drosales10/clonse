-- Add the current status change date used by the legacy user_status_date behavior.
ALTER TABLE "users" ADD COLUMN "status_updated_at" TIMESTAMP(3);

-- Normalized subset of legacy se_actions for the editstatus activity.
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "object_privacy" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activities_actor_id_type_created_at_idx" ON "activities"("actor_id", "type", "created_at");
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at");

ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
