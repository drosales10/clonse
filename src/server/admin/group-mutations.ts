import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminGroupRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminGroups(): Promise<AdminGroupRow[]> {
  return db.group.findMany({
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

export async function setAdminGroupCatalogVisible(
  groupId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const group = await db.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) return { ok: false, reason: "not_found" };
  await db.group.update({
    where: { id: group.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
