-- Additive profile fields for the first public profile read increment.
ALTER TABLE "users" ADD COLUMN "status" TEXT;
ALTER TABLE "users" ADD COLUMN "profile_privacy" INTEGER NOT NULL DEFAULT 32;
