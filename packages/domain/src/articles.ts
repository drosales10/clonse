export const ARTICLE_PAGE_SIZE = 10;
export const ARTICLE_MAX_PAGE = 10_000;

export const ARTICLE_ACCESS = {
  OWNER: 1,
  REGISTERED: 16,
  ANONYMOUS: 32,
} as const;

export type ArticleSort = "created" | "views" | "title";

export interface ArticleCatalogQuery {
  page: number;
  search: string;
  categoryId: string | null;
  featured: boolean;
  sort: ArticleSort;
}

export interface ArticleCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicArticleAuthor {
  username: string;
  displayName: string;
}

export interface PublicArticle {
  id: string;
  legacyId: number | null;
  title: string;
  excerpt: string | null;
  publishedAt: Date;
  updatedAt: Date;
  views: number;
  featured: boolean;
  author: PublicArticleAuthor;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface ArticleCatalogResult {
  items: PublicArticle[];
  pagination: ArticleCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeArticleQuery(input: Partial<ArticleCatalogQuery>): ArticleCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), ARTICLE_MAX_PAGE);
  const search = typeof input.search === "string" ? input.search.trim().slice(0, 100) : "";
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  const featured = input.featured === true;
  const sort: ArticleSort = input.sort === "views" || input.sort === "title" ? input.sort : "created";
  return { page, search, categoryId, featured, sort };
}

export function canReadArticle(ownerId: string, privacy: number, viewerId: string | null): boolean {
  if (viewerId === ownerId) return true;
  const viewerAccess = viewerId === null ? ARTICLE_ACCESS.ANONYMOUS : ARTICLE_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}
