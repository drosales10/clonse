-- Album media storage keys (expand-only). Legacy rows stay nullable without binaries.

ALTER TABLE "album_media" ADD COLUMN "mime_type" TEXT;
ALTER TABLE "album_media" ADD COLUMN "storage_key" TEXT;
