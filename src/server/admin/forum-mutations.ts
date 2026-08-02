import { db } from "@/server/db/client";

export type AdminForumMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminForumTopicRow {
  id: string;
  title: string;
  isLocked: boolean;
  isSticky: boolean;
  isAnnouncement: boolean;
  replyCount: number;
  createdAt: Date;
  author: { username: string; displayName: string };
  category: { id: string; title: string };
  instance: { id: string; name: string | null };
}

export interface AdminForumCategoryRow {
  id: string;
  title: string;
  isLocked: boolean;
  publicCanRead: boolean;
  instance: { id: string; name: string | null };
}

export async function listAdminForumTopics(): Promise<AdminForumTopicRow[]> {
  const rows = await db.forumPost.findMany({
    where: { parentId: null },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      isLocked: true,
      isSticky: true,
      isAnnouncement: true,
      replyCount: true,
      createdAt: true,
      author: { select: { username: true, displayName: true } },
      category: { select: { id: true, title: true } },
      instance: { select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? "Sin título",
    isLocked: row.isLocked,
    isSticky: row.isSticky,
    isAnnouncement: row.isAnnouncement,
    replyCount: row.replyCount,
    createdAt: row.createdAt,
    author: row.author,
    category: row.category,
    instance: row.instance,
  }));
}

export async function listAdminForumCategories(): Promise<AdminForumCategoryRow[]> {
  const rows = await db.forumCategory.findMany({
    orderBy: [{ instanceId: "asc" }, { position: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      isLocked: true,
      publicCanRead: true,
      instance: { select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    isLocked: row.isLocked,
    publicCanRead: row.publicCanRead,
    instance: row.instance,
  }));
}

export async function setAdminForumTopicLocked(
  topicId: string,
  isLocked: boolean,
): Promise<AdminForumMutationResult> {
  const topic = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: { id: true },
  });
  if (!topic) return { ok: false, reason: "not_found" };
  await db.forumPost.update({ where: { id: topic.id }, data: { isLocked } });
  return { ok: true };
}

export async function setAdminForumCategoryLocked(
  categoryId: string,
  isLocked: boolean,
): Promise<AdminForumMutationResult> {
  const category = await db.forumCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) return { ok: false, reason: "not_found" };
  await db.forumCategory.update({ where: { id: category.id }, data: { isLocked } });
  return { ok: true };
}

export async function setAdminForumTopicSticky(
  topicId: string,
  isSticky: boolean,
): Promise<AdminForumMutationResult> {
  const topic = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: { id: true },
  });
  if (!topic) return { ok: false, reason: "not_found" };
  await db.forumPost.update({ where: { id: topic.id }, data: { isSticky } });
  return { ok: true };
}

export async function setAdminForumTopicAnnouncement(
  topicId: string,
  isAnnouncement: boolean,
): Promise<AdminForumMutationResult> {
  const topic = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: { id: true },
  });
  if (!topic) return { ok: false, reason: "not_found" };
  await db.forumPost.update({ where: { id: topic.id }, data: { isAnnouncement } });
  return { ok: true };
}
