-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_sent_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token_hash" TEXT;
