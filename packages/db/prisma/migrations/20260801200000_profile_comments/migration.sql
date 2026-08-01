-- Preserve the legacy user_comments privacy mask separately from profile visibility.
ALTER TABLE "users" ADD COLUMN "comments_privacy" INTEGER NOT NULL DEFAULT 63;

-- Normalized destination for legacy se_profilecomments.
CREATE TABLE "profile_comments" (
    "id" TEXT NOT NULL,
    "profile_owner_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_comments_profile_owner_id_created_at_idx" ON "profile_comments"("profile_owner_id", "created_at");
CREATE INDEX "profile_comments_author_id_created_at_idx" ON "profile_comments"("author_id", "created_at");

ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_profile_owner_id_fkey"
  FOREIGN KEY ("profile_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
