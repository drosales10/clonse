export const BUSINESS_PAGE_SIZE = 10;
export const BUSINESS_MAX_PAGE = 10_000;

export const BUSINESS_ACCESS = {
  OWNER: 1,
  FRIEND: 2,
  FRIEND_OF_FRIEND: 4,
  SUBNETWORK: 8,
  REGISTERED: 16,
  ANONYMOUS: 32,
} as const;

export type BusinessSort = "created" | "updated" | "rating" | "views" | "comments";

export interface BusinessCatalogQuery {
  page: number;
  search: string;
  categoryId: string | null;
  sort: BusinessSort;
}

export interface BusinessCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicBusinessOwner {
  username: string;
  displayName: string;
}

export interface PublicBusiness {
  id: string;
  legacyId: number | null;
  slug: string | null;
  title: string;
  summary: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  featured: boolean;
  sponsored: boolean;
  views: number;
  totalComments: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  owner: PublicBusinessOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface BusinessCatalogResult {
  items: PublicBusiness[];
  pagination: BusinessCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeBusinessQuery(input: Partial<BusinessCatalogQuery>): BusinessCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), BUSINESS_MAX_PAGE);
  const search = typeof input.search === "string" ? input.search.trim().slice(0, 100) : "";
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  const sort: BusinessSort = input.sort === "updated" || input.sort === "rating" || input.sort === "views" || input.sort === "comments"
    ? input.sort
    : "created";
  return { page, search, categoryId, sort };
}

export function canReadBusiness(
  ownerId: string,
  privacy: number,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  const viewerAccess = viewerId === null ? BUSINESS_ACCESS.ANONYMOUS : BUSINESS_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}

export function isBusinessAvailable(
  searchable: boolean,
  approvedAt: Date | null,
  expiresAt: Date | null,
  now = new Date(),
): boolean {
  return searchable && approvedAt !== null && (expiresAt === null || expiresAt > now);
}
