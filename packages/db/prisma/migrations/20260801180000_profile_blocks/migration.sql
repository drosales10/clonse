-- CreateTable
CREATE TABLE "profile_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_blocks_blocker_id_blocked_id_key" ON "profile_blocks"("blocker_id", "blocked_id");
CREATE INDEX "profile_blocks_blocked_id_idx" ON "profile_blocks"("blocked_id");

-- AddForeignKey
ALTER TABLE "profile_blocks" ADD CONSTRAINT "profile_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_blocks" ADD CONSTRAINT "profile_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
