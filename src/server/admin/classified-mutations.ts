import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminClassifiedRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminClassifieds(): Promise<AdminClassifiedRow[]> {
  return db.classified.findMany({
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

export async function setAdminClassifiedCatalogVisible(
  classifiedId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const classified = await db.classified.findUnique({ where: { id: classifiedId }, select: { id: true } });
  if (!classified) return { ok: false, reason: "not_found" };
  await db.classified.update({
    where: { id: classified.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
