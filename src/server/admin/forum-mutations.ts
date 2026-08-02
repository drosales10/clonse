import { db } from "@/server/db/client";

export type AdminForumMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "has_children" };

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

export interface AdminForumTopicDetail {
  id: string;
  title: string;
  body: string | null;
  isLocked: boolean;
  isSticky: boolean;
  isAnnouncement: boolean;
  replyCount: number;
  views: number;
  createdAt: Date;
  author: { username: string; displayName: string };
  category: { id: string; title: string };
  instance: { id: string; name: string | null };
}

export interface AdminForumCategoryDetail {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isLocked: boolean;
  publicCanRead: boolean;
  instance: { id: string; name: string | null };
  parentId: string | null;
}

export async function getAdminForumTopicDetail(topicId: string): Promise<AdminForumTopicDetail | null> {
  const row = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: {
      id: true,
      title: true,
      body: true,
      isLocked: true,
      isSticky: true,
      isAnnouncement: true,
      replyCount: true,
      views: true,
      createdAt: true,
      author: { select: { username: true, displayName: true } },
      category: { select: { id: true, title: true } },
      instance: { select: { id: true, name: true } },
    },
  });
  if (!row) return null;
  return { ...row, title: row.title ?? "Sin título" };
}

export async function getAdminForumCategoryDetail(
  categoryId: string,
): Promise<AdminForumCategoryDetail | null> {
  return db.forumCategory.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      isLocked: true,
      publicCanRead: true,
      parentId: true,
      instance: { select: { id: true, name: true } },
    },
  });
}

export async function updateAdminForumTopic(
  topicId: string,
  input: { title: string; body: string },
): Promise<AdminForumMutationResult> {
  const topic = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: { id: true },
  });
  if (!topic) return { ok: false, reason: "not_found" };
  await db.forumPost.update({
    where: { id: topic.id },
    data: {
      title: input.title,
      body: input.body,
      modifiedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminForumTopic(topicId: string): Promise<AdminForumMutationResult> {
  const topic = await db.forumPost.findFirst({
    where: { id: topicId, parentId: null },
    select: { id: true },
  });
  if (!topic) return { ok: false, reason: "not_found" };
  await db.forumPost.delete({ where: { id: topic.id } });
  return { ok: true };
}

export async function updateAdminForumCategory(
  categoryId: string,
  input: {
    title: string;
    description: string | null;
    position: number;
  },
): Promise<AdminForumMutationResult> {
  const category = await db.forumCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) return { ok: false, reason: "not_found" };
  await db.forumCategory.update({
    where: { id: category.id },
    data: input,
  });
  return { ok: true };
}

export async function deleteAdminForumCategory(categoryId: string): Promise<AdminForumMutationResult> {
  const category = await db.forumCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, children: { select: { id: true }, take: 1 } },
  });
  if (!category) return { ok: false, reason: "not_found" };
  if (category.children.length > 0) return { ok: false, reason: "has_children" };
  await db.forumCategory.delete({ where: { id: category.id } });
  return { ok: true };
}

export async function listAdminForumInstances() {
  return db.forumInstance.findMany({
    where: { mode: "forum" },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}
