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
  isOwn: boolean;
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
  catalogVisible: boolean,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (!catalogVisible) return false;
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

export interface PublicBusinessDetail extends PublicBusiness {
  description: string | null;
  phone: string | null;
  url: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  isOwner: boolean;
}

export type BusinessCreateFormState = {
  errors?: {
    form?: string[];
    title?: string[];
    summary?: string[];
    description?: string[];
    city?: string[];
    province?: string[];
    country?: string[];
    categoryId?: string[];
  };
  message?: string;
  success?: boolean;
};

export type BusinessManageFormState = BusinessCreateFormState;

export function businessWriteInputFromFormData(formData: FormData): {
  title: string;
  summary: string;
  description: string;
  city: string;
  province: string;
  country: string;
  categoryId: string | null;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  const rawCategory = read("categoryId");
  return {
    title: read("title"),
    summary: read("summary"),
    description: read("description"),
    city: read("city"),
    province: read("province"),
    country: read("country"),
    categoryId: rawCategory || null,
  };
}

export function validateBusinessWriteInput(input: {
  title: string;
  summary: string;
  description: string;
  city: string;
  province: string;
  country: string;
  categoryId: string | null;
}):
  | {
      success: true;
      data: {
        title: string;
        summary: string | null;
        description: string | null;
        city: string | null;
        province: string | null;
        country: string | null;
        categoryId: string | null;
      };
    }
  | { success: false; errors: NonNullable<BusinessCreateFormState["errors"]> } {
  const errors: NonNullable<BusinessCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.summary.length > 500) {
    errors.summary = ["El resumen no puede superar 500 caracteres."];
  }
  if (input.description.length > 5000) {
    errors.description = ["La descripción no puede superar 5000 caracteres."];
  }
  if (input.city.length > 100) errors.city = ["La ciudad no puede superar 100 caracteres."];
  if (input.province.length > 100) errors.province = ["La provincia no puede superar 100 caracteres."];
  if (input.country.length > 100) errors.country = ["El país no puede superar 100 caracteres."];
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      title: input.title,
      summary: input.summary || null,
      description: input.description || null,
      city: input.city || null,
      province: input.province || null,
      country: input.country || null,
      categoryId: input.categoryId,
    },
  };
}
