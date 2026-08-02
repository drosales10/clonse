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
  isOwn: boolean;
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

export function canReadArticle(
  ownerId: string,
  privacy: number,
  catalogVisible: boolean,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (!catalogVisible) return false;
  const viewerAccess = viewerId === null ? ARTICLE_ACCESS.ANONYMOUS : ARTICLE_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}

export interface PublicArticleDetail extends PublicArticle {
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  isOwner: boolean;
}

export type ArticleCreateFormState = {
  errors?: { form?: string[]; title?: string[]; body?: string[]; categoryId?: string[] };
  message?: string;
  success?: boolean;
};

export type ArticleManageFormState = ArticleCreateFormState;

export function articleWriteInputFromFormData(formData: FormData): {
  title: string;
  body: string;
  categoryId: string | null;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  const rawCategory = read("categoryId");
  return { title: read("title"), body: read("body"), categoryId: rawCategory || null };
}

export function validateArticleWriteInput(input: {
  title: string;
  body: string;
  categoryId: string | null;
}):
  | { success: true; data: { title: string; body: string | null; categoryId: string | null } }
  | { success: false; errors: NonNullable<ArticleCreateFormState["errors"]> } {
  const errors: NonNullable<ArticleCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.body.length > 10000) {
    errors.body = ["El contenido no puede superar 10000 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: { title: input.title, body: input.body || null, categoryId: input.categoryId },
  };
}
