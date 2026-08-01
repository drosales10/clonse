import { Prisma } from "@prisma/client";

import {
  BLOG_PAGE_SIZE,
  canReadBlogEntry,
  normalizeBlogQuery,
  type BlogCatalogQuery,
  type BlogCatalogResult,
  type PublicBlogEntry,
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
  views: true,
  authorId: true,
  author: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.BlogEntrySelect;

type BlogEntryRow = Prisma.BlogEntryGetPayload<{ select: typeof blogEntrySelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function getBlogCatalog(
  viewerId: string | null,
  input: Partial<BlogCatalogQuery> = {},
): Promise<BlogCatalogResult> {
  const query = normalizeBlogQuery(input);
  const categories = await db.blogCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.blogEntry.findMany({
    where: {
      searchable: true,
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

  const visible = rows.filter((row) => canReadBlogEntry(row.authorId, row.privacy, viewerId));
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


export async function getBlogEntryDetail(viewerId: string | null, entryId: string): Promise<import("@domain/blogs").PublicBlogEntryDetail | null> {
  const legacyId = parseLegacyBlogEntryId(entryId);
  const row = await db.blogEntry.findFirst({
    where: {
      OR: [
        { id: entryId },
        ...(legacyId === null ? [] : [{ legacyId }]),
      ],
      author: { enabled: true },
    },
    select: blogEntrySelect,
  });
  if (!row || !canReadBlogEntry(row.authorId, row.privacy, viewerId)) return null;
  return {
    ...toPublicBlogEntry(row),
    body: toSafeText(row.body),
  };
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
