-- Preserve the legacy user_saveviews preference separately from profile privacy.
ALTER TABLE "users" ADD COLUMN "save_profile_views" BOOLEAN NOT NULL DEFAULT true;

-- Aggregate representation of legacy se_profileviews.profileview_views.
CREATE TABLE "profile_view_stats" (
    "id" TEXT NOT NULL,
    "profile_owner_id" TEXT NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_view_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_view_stats_profile_owner_id_key" ON "profile_view_stats"("profile_owner_id");

ALTER TABLE "profile_view_stats" ADD CONSTRAINT "profile_view_stats_profile_owner_id_fkey"
  FOREIGN KEY ("profile_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Normalized replacement for the legacy CSV profileview_viewers field.
CREATE TABLE "profile_view_viewers" (
    "id" TEXT NOT NULL,
    "stats_id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_view_viewers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_view_viewers_stats_id_viewer_id_key" ON "profile_view_viewers"("stats_id", "viewer_id");
CREATE INDEX "profile_view_viewers_stats_id_viewed_at_idx" ON "profile_view_viewers"("stats_id", "viewed_at");
CREATE INDEX "profile_view_viewers_viewer_id_viewed_at_idx" ON "profile_view_viewers"("viewer_id", "viewed_at");

ALTER TABLE "profile_view_viewers" ADD CONSTRAINT "profile_view_viewers_stats_id_fkey"
  FOREIGN KEY ("stats_id") REFERENCES "profile_view_stats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_view_viewers" ADD CONSTRAINT "profile_view_viewers_viewer_id_fkey"
  FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
