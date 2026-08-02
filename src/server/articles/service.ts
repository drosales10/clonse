import { Prisma } from "@prisma/client";

import {
  ARTICLE_ACCESS,
  ARTICLE_PAGE_SIZE,
  canReadArticle,
  normalizeArticleQuery,
  type ArticleCatalogQuery,
  type ArticleCatalogResult,
  type PublicArticle,
  type PublicArticleDetail,
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
  catalogVisible: true,
  authorId: true,
  categoryId: true,
  author: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.ArticleSelect;

type ArticleRow = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveArticleCategories(): Promise<CategoryRow[]> {
  return db.articleCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getArticleCatalog(
  viewerId: string | null,
  input: Partial<ArticleCatalogQuery> = {},
): Promise<ArticleCatalogResult> {
  const query = normalizeArticleQuery(input);
  const categories = await listActiveArticleCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.article.findMany({
    where: {
      approved: true,
      draft: false,
      searchable: true,
      catalogVisible: true,
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
    orderBy:
      query.sort === "views"
        ? [{ views: "desc" }, { id: "asc" }]
        : query.sort === "title"
          ? [{ title: "asc" }, { id: "asc" }]
          : [{ publishedAt: "desc" }, { id: "asc" }],
    select: articleSelect,
  });

  const visible = rows.filter((row) =>
    canReadArticle(row.authorId, row.privacy, row.catalogVisible, viewerId),
  );
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

export async function getArticleDetail(
  viewerId: string | null,
  articleId: string,
): Promise<PublicArticleDetail | null> {
  const legacyId = parseLegacyArticleId(articleId);
  const row = await db.article.findFirst({
    where: {
      OR: [{ id: articleId }, ...(legacyId === null ? [] : [{ legacyId }])],
      author: { enabled: true },
    },
    select: articleSelect,
  });
  if (!row) return null;
  if (!canReadArticle(row.authorId, row.privacy, row.catalogVisible, viewerId)) return null;

  const isOwner = viewerId === row.authorId;
  if (!isOwner && (row.draft || !row.approved)) return null;

  return {
    ...toPublicArticle(row),
    body: toSafeText(row.body),
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    isOwner,
  };
}

export type CreateArticleResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createArticle(
  authorId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<CreateArticleResult> {
  const author = await requireActiveOwner(authorId);
  if (!author) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.articleCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const article = await db.article.create({
    data: {
      authorId: author.id,
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      publishedAt: now,
      updatedAt: now,
      approved: true,
      draft: false,
      searchable: true,
      catalogVisible: true,
      privacy: ARTICLE_ACCESS.ANONYMOUS | ARTICLE_ACCESS.REGISTERED,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: article.id };
}

export type UpdateArticleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnArticle(
  authorId: string,
  articleId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<UpdateArticleResult> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });
  if (!article) return { ok: false, reason: "not_found" };
  if (article.authorId !== authorId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.articleCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.article.update({
    where: { id: article.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetArticleVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnArticleCatalogVisible(
  authorId: string,
  articleId: string,
  catalogVisible: boolean,
): Promise<SetArticleVisibleResult> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });
  if (!article) return { ok: false, reason: "not_found" };
  if (article.authorId !== authorId) return { ok: false, reason: "forbidden" };

  await db.article.update({
    where: { id: article.id },
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

function toSafeText(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function parseLegacyArticleId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
