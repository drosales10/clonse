import { Prisma } from "@prisma/client";

import {
  FORUM_PAGE_SIZE,
  makePagination,
  normalizeForumQuery,
  type ForumQuery,
  type PublicForumCategory,
  type PublicForumInstance,
  type PublicForumPost,
  type PublicForumTopic,
} from "@domain/forum";
import { db } from "@/server/db/client";

const instanceSelect = { id: true, legacyId: true, name: true, description: true, position: true } satisfies Prisma.ForumInstanceSelect;
const categorySelect = { id: true, legacyId: true, parentId: true, title: true, description: true, position: true, publicCanRead: true, isLocked: true } satisfies Prisma.ForumCategorySelect;
const authorSelect = { username: true, displayName: true } satisfies Prisma.UserSelect;
const topicSelect = {
  id: true, legacyId: true, categoryId: true, title: true, body: true, authorId: true, createdAt: true, views: true, replyCount: true,
  rating: true, isLocked: true, isAnnouncement: true, isSticky: true, hasAttachments: true,
  author: { select: authorSelect },
  replies: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.ForumPostSelect;
const postSelect = {
  id: true, legacyId: true, parentId: true, body: true, createdAt: true, modifiedAt: true, hasAttachments: true,
  author: { select: authorSelect },
} satisfies Prisma.ForumPostSelect;

type TopicRow = Prisma.ForumPostGetPayload<{ select: typeof topicSelect }>;
type PostRow = Prisma.ForumPostGetPayload<{ select: typeof postSelect }>;

export interface ForumCatalogResult {
  instances: PublicForumInstance[];
  instance: PublicForumInstance | null;
  categories: PublicForumCategory[];
  topics: PublicForumTopic[];
  pagination: ReturnType<typeof makePagination>;
}

export interface ForumTopicResult {
  instance: PublicForumInstance;
  category: PublicForumCategory;
  topic: PublicForumTopic;
  posts: PublicForumPost[];
  pagination: ReturnType<typeof makePagination>;
}

export async function getForumCatalog(input: Partial<ForumQuery> = {}): Promise<ForumCatalogResult> {
  const query = normalizeForumQuery(input);
  const instances = await db.forumInstance.findMany({ where: { mode: "forum" }, orderBy: [{ position: "asc" }, { id: "asc" }], select: instanceSelect });
  if (!query.instanceId) {
    return { instances, instance: null, categories: [], topics: [], pagination: makePagination(0, query.page) };
  }
  const instanceIdentifier = query.instanceId;
  const instance = instances.find((item) => matchesIdentifier(item.id, item.legacyId, instanceIdentifier)) ?? null;
  if (!instance) return { instances, instance: null, categories: [], topics: [], pagination: makePagination(0, query.page) };

  const allCategories = await db.forumCategory.findMany({ where: { instanceId: instance.id }, orderBy: [{ position: "asc" }, { id: "asc" }], select: categorySelect });
  const categories = allCategories.filter((category) => isPublicCategory(category, allCategories));
  let selectedCategory: PublicForumCategory | null = null;
  if (query.categoryId) {
    const categoryIdentifier = query.categoryId;
    selectedCategory = categories.find((category) => matchesIdentifier(category.id, category.legacyId, categoryIdentifier)) ?? null;
  }
  const categoryId = selectedCategory?.id ?? null;
  const categoryIds = categoryId ? resolveForumCategoryIds(categoryId, categories) : categories.map((category) => category.id);
  const rows = categoryIds.length === 0 ? [] : await db.forumPost.findMany({
    where: { instanceId: instance.id, categoryId: { in: categoryIds }, parentId: null, author: { enabled: true } },
    orderBy: [{ isAnnouncement: "desc" }, { isSticky: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    select: topicSelect,
  });
  const pagination = makePagination(rows.length, query.page);
  const startIndex = (pagination.page - 1) * FORUM_PAGE_SIZE;
  return {
    instances,
    instance,
    categories,
    topics: rows.slice(startIndex, startIndex + FORUM_PAGE_SIZE).map(toTopic),
    pagination,
  };
}

export async function getForumTopic(input: ForumQuery): Promise<ForumTopicResult | null> {
  const query = normalizeForumQuery(input);
  if (!query.instanceId || !query.categoryId || !query.topicId) return null;
  const instanceIdentifier = query.instanceId;
  const categoryIdentifier = query.categoryId;
  const topicIdentifier = query.topicId;
  const instance = await db.forumInstance.findFirst({
    where: {
      mode: "forum",
      OR: [
        { id: instanceIdentifier },
        ...(toPositiveLegacyId(instanceIdentifier) !== null ? [{ legacyId: toPositiveLegacyId(instanceIdentifier) }] : []),
      ],
    },
    select: instanceSelect,
  });
  if (!instance) return null;
  const allCategories = await db.forumCategory.findMany({ where: { instanceId: instance.id }, select: categorySelect });
  const category = allCategories.find((item) => matchesIdentifier(item.id, item.legacyId, categoryIdentifier));
  if (!category || !isPublicCategory(category, allCategories)) return null;
  const topic = await db.forumPost.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: topicIdentifier },
            ...(toPositiveLegacyId(topicIdentifier) !== null ? [{ legacyId: toPositiveLegacyId(topicIdentifier) }] : []),
          ],
        },
        { instanceId: instance.id, categoryId: category.id, parentId: null, author: { enabled: true } },
      ],
    },
    select: topicSelect,
  });
  if (!topic) return null;
  const rows = await db.forumPost.findMany({ where: { parentId: topic.id, author: { enabled: true } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: postSelect });
  const pagination = makePagination(rows.length + 1, query.page);
  const startIndex = (pagination.page - 1) * FORUM_PAGE_SIZE;
  const pageRows = [topic, ...rows].slice(startIndex, startIndex + FORUM_PAGE_SIZE);
  return { instance, category, topic: toTopic(topic), posts: pageRows.map((row) => toPost(row, topic.id)), pagination };
}

function isPublicCategory(category: { id: string; parentId: string | null; publicCanRead: boolean }, categories: Array<{ id: string; parentId: string | null; publicCanRead: boolean }>): boolean {
  if (!category.publicCanRead) return false;
  if (!category.parentId) return true;
  const parent = categories.find((item) => item.id === category.parentId);
  return parent ? isPublicCategory(parent, categories) : false;
}

function toTopic(row: TopicRow): PublicForumTopic {
  return {
    id: row.id, legacyId: row.legacyId, categoryId: row.categoryId, title: row.title ?? "Sin título", bodyExcerpt: toTextExcerpt(row.body),
    author: row.author, createdAt: row.createdAt, lastPostAt: row.replies[0]?.createdAt ?? row.createdAt, replyCount: row.replyCount,
    views: row.views, rating: row.rating, isLocked: row.isLocked, isAnnouncement: row.isAnnouncement, isSticky: row.isSticky, hasAttachments: row.hasAttachments,
  };
}

function toPost(row: PostRow | TopicRow, topicId: string): PublicForumPost {
  return { id: row.id, legacyId: row.legacyId, topicId, body: row.body, author: row.author, createdAt: row.createdAt, modifiedAt: "modifiedAt" in row ? row.modifiedAt : null, hasAttachments: row.hasAttachments };
}

function toTextExcerpt(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function resolveForumCategoryIds(
  selectedId: string,
  categories: Array<{ id: string; parentId: string | null }>,
): string[] {
  const selected = categories.find((category) => category.id === selectedId);
  if (selected && selected.parentId !== null) return [selected.id];

  const descendants = new Set([selectedId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && descendants.has(category.parentId) && !descendants.has(category.id)) {
        descendants.add(category.id);
        changed = true;
      }
    }
  }
  return [...descendants];
}

function toPositiveLegacyId(identifier: string | null): number | null {
  if (!identifier || !/^\d+$/.test(identifier)) return null;
  const value = Number(identifier);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function matchesIdentifier(id: string, legacyId: number | null, identifier: string): boolean {
  const numericId = toPositiveLegacyId(identifier);
  return id === identifier || (numericId !== null && legacyId === numericId);
}
