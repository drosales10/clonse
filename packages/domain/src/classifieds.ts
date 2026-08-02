export const CLASSIFIED_PAGE_SIZE = 10;
export const CLASSIFIED_MAX_PAGE = 10_000;

export const CLASSIFIED_ACCESS = {
  OWNER: 1,
  FRIEND: 2,
  FRIEND_OF_FRIEND: 4,
  SUBNETWORK: 8,
  REGISTERED: 16,
  ANONYMOUS: 32,
} as const;

export type ClassifiedSort = "created" | "updated" | "views" | "comments";

export interface ClassifiedCatalogQuery {
  page: number;
  search: string;
  categoryId: string | null;
  sort: ClassifiedSort;
}

export interface ClassifiedCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicClassifiedOwner {
  username: string;
  displayName: string;
}

export interface PublicClassified {
  id: string;
  legacyId: number | null;
  slug: string | null;
  title: string;
  body: string | null;
  views: number;
  totalComments: number;
  createdAt: Date;
  updatedAt: Date;
  isOwn: boolean;
  owner: PublicClassifiedOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicClassifiedDetail extends PublicClassified {
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  isOwner: boolean;
}

export type ClassifiedCreateFormState = {
  errors?: { form?: string[]; title?: string[]; body?: string[]; categoryId?: string[] };
  message?: string;
  success?: boolean;
};

export type ClassifiedManageFormState = ClassifiedCreateFormState;

export interface ClassifiedCatalogResult {
  items: PublicClassified[];
  pagination: ClassifiedCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeClassifiedQuery(input: Partial<ClassifiedCatalogQuery>): ClassifiedCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), CLASSIFIED_MAX_PAGE);
  const search = typeof input.search === "string" ? input.search.trim().slice(0, 100) : "";
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  const sort: ClassifiedSort = input.sort === "updated" || input.sort === "views" || input.sort === "comments"
    ? input.sort
    : "created";
  return { page, search, categoryId, sort };
}

export function canReadClassified(
  ownerId: string,
  privacy: number,
  catalogVisible: boolean,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (!catalogVisible) return false;
  const viewerAccess = viewerId === null ? CLASSIFIED_ACCESS.ANONYMOUS : CLASSIFIED_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}

export function classifiedWriteInputFromFormData(formData: FormData): {
  title: string;
  body: string;
  categoryId: string | null;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  const rawCategory = read("categoryId");
  return { title: read("title"), body: read("body"), categoryId: rawCategory || null };
}

export function validateClassifiedWriteInput(input: {
  title: string;
  body: string;
  categoryId: string | null;
}):
  | { success: true; data: { title: string; body: string | null; categoryId: string | null } }
  | { success: false; errors: NonNullable<ClassifiedCreateFormState["errors"]> } {
  const errors: NonNullable<ClassifiedCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.body.length > 5000) {
    errors.body = ["El contenido no puede superar 5000 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: { title: input.title, body: input.body || null, categoryId: input.categoryId },
  };
}
