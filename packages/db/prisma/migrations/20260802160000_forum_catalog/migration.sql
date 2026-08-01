-- Additive native public forum catalog. No legacy tables or rows are touched.
CREATE TABLE "forum_instances" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "mode" TEXT NOT NULL DEFAULT 'forum',
    "name" TEXT,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "forum_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forum_categories" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "instance_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "public_can_read" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "author_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "title" TEXT,
    "body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "modified_at" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_announcement" BOOLEAN NOT NULL DEFAULT false,
    "is_sticky" BOOLEAN NOT NULL DEFAULT false,
    "has_attachments" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "forum_instances_legacy_id_key" ON "forum_instances"("legacy_id");
CREATE UNIQUE INDEX "forum_categories_legacy_id_key" ON "forum_categories"("legacy_id");
CREATE UNIQUE INDEX "forum_posts_legacy_id_key" ON "forum_posts"("legacy_id");
CREATE INDEX "forum_instances_mode_position_idx" ON "forum_instances"("mode", "position");
CREATE INDEX "forum_categories_instance_id_parent_id_position_idx" ON "forum_categories"("instance_id", "parent_id", "position");
CREATE INDEX "forum_categories_instance_id_public_can_read_idx" ON "forum_categories"("instance_id", "public_can_read");
CREATE INDEX "forum_posts_instance_id_category_id_parent_id_created_at_idx" ON "forum_posts"("instance_id", "category_id", "parent_id", "created_at");
CREATE INDEX "forum_posts_category_id_parent_id_is_sticky_is_announcement_idx" ON "forum_posts"("category_id", "parent_id", "is_sticky", "is_announcement");
CREATE INDEX "forum_posts_parent_id_created_at_idx" ON "forum_posts"("parent_id", "created_at");

ALTER TABLE "forum_categories" ADD CONSTRAINT "forum_categories_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "forum_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_categories" ADD CONSTRAINT "forum_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "forum_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "forum_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
