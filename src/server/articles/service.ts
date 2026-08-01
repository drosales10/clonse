import { Prisma } from "@prisma/client";

import {
  ARTICLE_PAGE_SIZE,
  canReadArticle,
  normalizeArticleQuery,
  type ArticleCatalogQuery,
  type ArticleCatalogResult,
  type PublicArticle,
} from "@domain/articles";
import { db } from "@/server/db/client";

const articleSelect = {
  id: true,
  legacyId: true,
  title: true,
  body: true,
  publishedAt: true,
  updatedAt: true,
  views: true,
  featured: true,
  approved: true,
  draft: true,
  searchable: true,
  privacy: true,
  authorId: true,
  author: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.ArticleSelect;

type ArticleRow = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function getArticleCatalog(
  viewerId: string | null,
  input: Partial<ArticleCatalogQuery> = {},
): Promise<ArticleCatalogResult> {
  const query = normalizeArticleQuery(input);
  const categories = await db.articleCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.article.findMany({
    where: {
      approved: true,
      draft: false,
      searchable: true,
      ...(query.featured ? { featured: true } : {}),
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
    orderBy: query.sort === "views"
      ? [{ views: "desc" }, { id: "asc" }]
      : query.sort === "title"
        ? [{ title: "asc" }, { id: "asc" }]
        : [{ publishedAt: "desc" }, { id: "asc" }],
    select: articleSelect,
  });

  const visible = rows.filter((row) => canReadArticle(row.authorId, row.privacy, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / ARTICLE_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * ARTICLE_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + ARTICLE_PAGE_SIZE).map(toPublicArticle);

  return {
    items,
    pagination: {
      page,
      pageSize: ARTICLE_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + ARTICLE_PAGE_SIZE, visible.length),
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

function toPublicArticle(row: ArticleRow): PublicArticle {
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    excerpt: toTextExcerpt(row.body),
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    views: row.views,
    featured: row.featured,
    author: { username: row.author.username, displayName: row.author.displayName },
    category: row.category,
  };
}

function toTextExcerpt(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 280 ? `${text.slice(0, 277)}...` : text;
}


export async function getArticleDetail(viewerId: string | null, articleId: string): Promise<import("@domain/articles").PublicArticleDetail | null> {
  const row = await db.article.findFirst({
    where: {
      id: articleId,
      approved: true,
      draft: false,
      searchable: true,
      author: { enabled: true },
    },
    select: articleSelect,
  });
  if (!row || !canReadArticle(row.authorId, row.privacy, viewerId)) return null;
  return {
    ...toPublicArticle(row),
    body: toSafeText(row.body),
  };
}

function toSafeText(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}
