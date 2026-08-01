export const GROUP_PAGE_SIZE = 10;
export const GROUP_MAX_PAGE = 10_000;

export type GroupSort = "created";

export interface GroupCatalogQuery {
  page: number;
  categoryId: string | null;
  sort: GroupSort;
}

export interface GroupCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicGroupOwner {
  username: string;
  displayName: string;
}

export interface PublicGroup {
  id: string;
  legacyId: number | null;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  owner: PublicGroupOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicGroupDetail extends PublicGroup {
  description: string | null;
}

export interface GroupCatalogResult {
  items: PublicGroup[];
  pagination: GroupCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeGroupQuery(input: Partial<GroupCatalogQuery>): GroupCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), GROUP_MAX_PAGE);
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  return { page, categoryId, sort: "created" };
}

export function canReadGroup(ownerId: string, catalogVisible: boolean, viewerId: string | null): boolean {
  return viewerId === ownerId || catalogVisible;
}
