import { Prisma } from "@prisma/client";

import { db } from "@/server/db/client";

export const ADMIN_USERS_PAGE_SIZE = 100;

export interface AdminUsersQuery {
  userFilter?: string;
  emailFilter?: string;
  enabledFilter?: "1" | "0";
  sort?: string;
  page?: number;
}

export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  email: string;
  enabled: boolean;
  verifiedAt: Date | null;
  signUpDate: Date;
}

export interface AdminUsersQueryState {
  userFilter: string;
  emailFilter: string;
  enabledFilter?: "1" | "0";
  sort: string;
  page: number;
}

export interface AdminUsersResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
  query: AdminUsersQueryState;
}

const orderByMap: Record<string, Prisma.UserOrderByWithRelationInput[]> = {
  i: [{ id: "asc" }],
  id: [{ id: "desc" }],
  u: [{ username: "asc" }],
  ud: [{ username: "desc" }],
  em: [{ email: "asc" }],
  emd: [{ email: "desc" }],
  v: [{ verifiedAt: "asc" }, { email: "asc" }],
  vd: [{ verifiedAt: "desc" }, { email: "asc" }],
  sd: [{ signUpDate: "asc" }],
  sdd: [{ signUpDate: "desc" }],
};

export async function getAdminUsers(input: AdminUsersQuery = {}): Promise<AdminUsersResult> {
  const sort = orderByMap[input.sort ?? "id"] ? input.sort ?? "id" : "id";
  const requestedPage = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? input.page ?? 1 : 1;
  const where: Prisma.UserWhereInput = {
    ...(input.userFilter ? { OR: [{ username: { contains: input.userFilter, mode: "insensitive" } }, { displayName: { contains: input.userFilter, mode: "insensitive" } }] } : {}),
    ...(input.emailFilter ? { email: { contains: input.emailFilter, mode: "insensitive" } } : {}),
    ...(input.enabledFilter ? { enabled: input.enabledFilter === "1" } : {}),
  };
  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const users = await db.user.findMany({
    where,
    orderBy: orderByMap[sort],
    skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
    take: ADMIN_USERS_PAGE_SIZE,
    select: { id: true, username: true, displayName: true, email: true, enabled: true, verifiedAt: true, signUpDate: true },
  });

  return {
    users,
    total,
    page,
    pageCount,
    query: { userFilter: input.userFilter ?? "", emailFilter: input.emailFilter ?? "", enabledFilter: input.enabledFilter, sort, page },
  };
}
