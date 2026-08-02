import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminBusinessRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminBusinesses(): Promise<AdminBusinessRow[]> {
  return db.business.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      createdAt: true,
      owner: { select: { username: true, displayName: true } },
      category: { select: { title: true } },
    },
  });
}

export async function setAdminBusinessCatalogVisible(
  businessId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, reason: "not_found" };
  await db.business.update({
    where: { id: business.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
