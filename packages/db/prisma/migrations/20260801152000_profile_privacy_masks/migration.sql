-- Legacy profile privacy values are cumulative masks. The first profile
-- migration used 32 as a placeholder default; normalize those untouched
-- values to the public mask before changing the schema default.
UPDATE "users"
SET "profile_privacy" = 63
WHERE "profile_privacy" = 32;

ALTER TABLE "users"
ALTER COLUMN "profile_privacy" SET DEFAULT 63;
