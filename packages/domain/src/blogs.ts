export const BLOG_PAGE_SIZE = 10;
export const BLOG_MAX_PAGE = 10_000;

export const BLOG_ACCESS = {
  OWNER: 1,
  REGISTERED: 16,
  ANONYMOUS: 32,
} as const;

export type BlogSort = "created" | "views";

export interface BlogCatalogQuery {
  page: number;
  search: string;
  categoryId: string | null;
  sort: BlogSort;
}

export interface BlogCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicBlogAuthor {
  username: string;
  displayName: string;
}

export interface PublicBlogEntry {
  id: string;
  legacyId: number | null;
  title: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  author: PublicBlogAuthor;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface BlogCatalogResult {
  items: PublicBlogEntry[];
  pagination: BlogCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeBlogQuery(input: Partial<BlogCatalogQuery>): BlogCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), BLOG_MAX_PAGE);
  const search = typeof input.search === "string" ? input.search.trim().slice(0, 100) : "";
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  const sort: BlogSort = input.sort === "views" ? "views" : "created";
  return { page, search, categoryId, sort };
}

export function canReadBlogEntry(ownerId: string, privacy: number, viewerId: string | null): boolean {
  if (viewerId === ownerId) return true;
  const viewerAccess = viewerId === null ? BLOG_ACCESS.ANONYMOUS : BLOG_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}
