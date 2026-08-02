-- Album and poll catalogs (expand-only). No imports, seeds or PII.

CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 0,
    "catalog_visible" BOOLEAN NOT NULL DEFAULT false,
    "comments_privacy" INTEGER,
    "cover_media_id" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "album_media" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "album_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "extension" TEXT NOT NULL DEFAULT '',
    "filesize" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "options" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "privacy" INTEGER NOT NULL DEFAULT 0,
    "catalog_visible" BOOLEAN NOT NULL DEFAULT false,
    "comments_privacy" INTEGER,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "option_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "albums_legacy_id_key" ON "albums"("legacy_id");
CREATE INDEX "albums_owner_id_idx" ON "albums"("owner_id");
CREATE INDEX "albums_searchable_catalog_visible_created_at_idx" ON "albums"("searchable", "catalog_visible", "created_at");

CREATE UNIQUE INDEX "album_media_legacy_id_key" ON "album_media"("legacy_id");
CREATE INDEX "album_media_album_id_sort_order_idx" ON "album_media"("album_id", "sort_order");

CREATE UNIQUE INDEX "polls_legacy_id_key" ON "polls"("legacy_id");
CREATE INDEX "polls_owner_id_idx" ON "polls"("owner_id");
CREATE INDEX "polls_searchable_catalog_visible_created_at_idx" ON "polls"("searchable", "catalog_visible", "created_at");
CREATE INDEX "polls_searchable_catalog_visible_total_votes_idx" ON "polls"("searchable", "catalog_visible", "total_votes");

CREATE UNIQUE INDEX "poll_votes_poll_id_user_id_key" ON "poll_votes"("poll_id", "user_id");
CREATE INDEX "poll_votes_poll_id_option_index_idx" ON "poll_votes"("poll_id", "option_index");
CREATE INDEX "poll_votes_user_id_idx" ON "poll_votes"("user_id");

ALTER TABLE "albums" ADD CONSTRAINT "albums_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "album_media" ADD CONSTRAINT "album_media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "polls" ADD CONSTRAINT "polls_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
