import { Prisma } from "@prisma/client";

import {
  BLOG_ACCESS,
  BLOG_PAGE_SIZE,
  canReadBlogEntry,
  normalizeBlogQuery,
  type BlogCatalogQuery,
  type BlogCatalogResult,
  type PublicBlogEntry,
  type PublicBlogEntryDetail,
} from "@domain/blogs";
import { db } from "@/server/db/client";

const blogEntrySelect = {
  id: true,
  legacyId: true,
  title: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  searchable: true,
  privacy: true,
  catalogVisible: true,
  views: true,
  authorId: true,
  categoryId: true,
  author: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.BlogEntrySelect;

type BlogEntryRow = Prisma.BlogEntryGetPayload<{ select: typeof blogEntrySelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveBlogCategories(): Promise<CategoryRow[]> {
  return db.blogCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getBlogCatalog(
  viewerId: string | null,
  input: Partial<BlogCatalogQuery> = {},
): Promise<BlogCatalogResult> {
  const query = normalizeBlogQuery(input);
  const categories = await listActiveBlogCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.blogEntry.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      author: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { body: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: query.sort === "views" ? [{ views: "desc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "asc" }],
    select: blogEntrySelect,
  });

  const visible = rows.filter((row) =>
    canReadBlogEntry(row.authorId, row.privacy, row.catalogVisible, viewerId),
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / BLOG_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * BLOG_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + BLOG_PAGE_SIZE).map(toPublicBlogEntry);

  return {
    items,
    pagination: {
      page,
      pageSize: BLOG_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + BLOG_PAGE_SIZE, visible.length),
    },
    categories,
  };
}

export async function getBlogEntryDetail(
  viewerId: string | null,
  entryId: string,
): Promise<PublicBlogEntryDetail | null> {
  const legacyId = parseLegacyBlogEntryId(entryId);
  const row = await db.blogEntry.findFirst({
    where: {
      OR: [{ id: entryId }, ...(legacyId === null ? [] : [{ legacyId }])],
      author: { enabled: true },
    },
    select: blogEntrySelect,
  });
  if (!row || !canReadBlogEntry(row.authorId, row.privacy, row.catalogVisible, viewerId)) return null;
  return {
    ...toPublicBlogEntry(row),
    body: toSafeText(row.body),
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    isOwner: viewerId === row.authorId,
  };
}

export type CreateBlogEntryResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createBlogEntry(
  authorId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<CreateBlogEntryResult> {
  const author = await requireActiveOwner(authorId);
  if (!author) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.blogCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const entry = await db.blogEntry.create({
    data: {
      authorId: author.id,
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
      searchable: true,
      catalogVisible: true,
      privacy: BLOG_ACCESS.ANONYMOUS | BLOG_ACCESS.REGISTERED,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: entry.id };
}

export type UpdateBlogEntryResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnBlogEntry(
  authorId: string,
  entryId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<UpdateBlogEntryResult> {
  const entry = await db.blogEntry.findUnique({
    where: { id: entryId },
    select: { id: true, authorId: true },
  });
  if (!entry) return { ok: false, reason: "not_found" };
  if (entry.authorId !== authorId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.blogCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.blogEntry.update({
    where: { id: entry.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetBlogEntryVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnBlogEntryCatalogVisible(
  authorId: string,
  entryId: string,
  catalogVisible: boolean,
): Promise<SetBlogEntryVisibleResult> {
  const entry = await db.blogEntry.findUnique({
    where: { id: entryId },
    select: { id: true, authorId: true },
  });
  if (!entry) return { ok: false, reason: "not_found" };
  if (entry.authorId !== authorId) return { ok: false, reason: "forbidden" };

  await db.blogEntry.update({
    where: { id: entry.id },
    data: {
      catalogVisible,
      searchable: catalogVisible ? true : undefined,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

async function requireActiveOwner(ownerId: string) {
  return db.user
    .findUnique({
      where: { id: ownerId },
      select: { id: true, enabled: true, verifiedAt: true },
    })
    .then((user) => (user?.enabled && user.verifiedAt ? user : null));
}

function resolveCategoryIds(categories: CategoryRow[], selectedId: string | null): string[] | null {
  if (!selectedId) return null;
  const selected = categories.find((category) => category.id === selectedId);
  if (!selected) return [];
  if (selected.parentId !== null) return [selected.id];

  const descendants = new Set([selected.id]);
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

function toPublicBlogEntry(row: BlogEntryRow): PublicBlogEntry {
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    excerpt: toTextExcerpt(row.body),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    views: row.views,
    author: { username: row.author.username, displayName: row.author.displayName },
    category: row.category,
  };
}

function toTextExcerpt(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? `${text.slice(0, 277)}...` : text;
}

function parseLegacyBlogEntryId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function toSafeText(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}
