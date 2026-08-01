-- CreateTable
CREATE TABLE "friend_connections" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "addressee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_connections_requester_id_addressee_id_key" ON "friend_connections"("requester_id", "addressee_id");
CREATE INDEX "friend_connections_requester_id_status_idx" ON "friend_connections"("requester_id", "status");
CREATE INDEX "friend_connections_addressee_id_status_idx" ON "friend_connections"("addressee_id", "status");

-- AddForeignKey
ALTER TABLE "friend_connections" ADD CONSTRAINT "friend_connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friend_connections" ADD CONSTRAINT "friend_connections_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
