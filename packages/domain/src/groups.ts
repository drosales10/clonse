export const GROUP_PAGE_SIZE = 10;
export const GROUP_MAX_PAGE = 10_000;

export const GROUP_MEMBER_RANK = {
  MEMBER: 0,
  OFFICIAL: 1,
  OWNER: 2,
} as const;

export const GROUP_MEMBER_STATUS = {
  INVITED: 0,
  ACTIVE: 1,
} as const;

export type GroupMembershipState = "none" | "member" | "owner" | "pending" | "invited";

export const MEMBER_LIST_PAGE_SIZE = 10;
export const MEMBER_LIST_MAX_PAGE = 10_000;

export interface PublicMemberUser {
  username: string;
  displayName: string;
}

export interface PublicGroupMemberRow {
  user: PublicMemberUser;
  rank: number;
  joinedAt: Date;
}

export interface PublicGroupPendingMember {
  userId: string;
  user: PublicMemberUser;
  requestedAt: Date;
}

export interface GroupMemberListResult {
  items: PublicGroupMemberRow[];
  pagination: GroupCatalogPagination;
}

export interface GroupPendingListResult {
  items: PublicGroupPendingMember[];
}

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
  isOwn: boolean;
  owner: PublicGroupOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicGroupDetail extends PublicGroup {
  description: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  membershipApprovalRequired: boolean;
  isOwner: boolean;
  memberCount: number;
  pendingCount: number;
  membership: GroupMembershipState;
  canJoin: boolean;
}

export interface GroupCatalogResult {
  items: PublicGroup[];
  pagination: GroupCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export type GroupCreateFormState = {
  errors?: { form?: string[]; title?: string[]; description?: string[]; categoryId?: string[] };
  message?: string;
  success?: boolean;
};

export type GroupManageFormState = {
  errors?: { form?: string[]; title?: string[]; description?: string[]; categoryId?: string[] };
  message?: string;
  success?: boolean;
};

export type GroupMembershipFormState = {
  errors?: { form?: string[]; username?: string[] };
  message?: string;
  success?: boolean;
};

export function normalizeMemberListPage(page: unknown): number {
  const requested = Number.isInteger(page) ? Number(page) : 1;
  return Math.min(Math.max(requested, 1), MEMBER_LIST_MAX_PAGE);
}

export function inviteUsernameFromFormData(formData: FormData): { username: string } {
  const username = typeof formData.get("username") === "string" ? String(formData.get("username")).trim() : "";
  return { username };
}

export function validateInviteUsername(input: { username: string }): GroupMembershipFormState["errors"] | null {
  if (!input.username || input.username.length > 64) {
    return { username: ["Indica un nombre de usuario válido."] };
  }
  return null;
}

export function resolveGroupMembership(
  isOwner: boolean,
  row: { approved: boolean; status: number } | null,
): GroupMembershipState {
  if (isOwner) return "owner";
  if (!row) return "none";
  if (row.status === GROUP_MEMBER_STATUS.INVITED && row.approved) return "invited";
  if (row.status === GROUP_MEMBER_STATUS.ACTIVE && !row.approved) return "pending";
  if (row.status === GROUP_MEMBER_STATUS.ACTIVE && row.approved) return "member";
  return "none";
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

export function groupWriteInputFromFormData(formData: FormData): {
  title: string;
  description: string;
  categoryId: string | null;
} {
  const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
  const description =
    typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
  const rawCategory =
    typeof formData.get("categoryId") === "string" ? String(formData.get("categoryId")).trim() : "";
  return { title, description, categoryId: rawCategory || null };
}

export function validateGroupWriteInput(input: {
  title: string;
  description: string;
  categoryId: string | null;
}):
  | { success: true; data: { title: string; description: string | null; categoryId: string | null } }
  | { success: false; errors: NonNullable<GroupCreateFormState["errors"]> } {
  const errors: NonNullable<GroupCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.description.length > 2000) {
    errors.description = ["La descripción no puede superar 2000 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      title: input.title,
      description: input.description || null,
      categoryId: input.categoryId,
    },
  };
}
