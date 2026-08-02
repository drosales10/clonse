import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminEventRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  inviteOnly: boolean;
  startsAt: Date | null;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminEvents(): Promise<AdminEventRow[]> {
  return db.event.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      catalogVisible: true,
      searchable: true,
      inviteOnly: true,
      startsAt: true,
      views: true,
      createdAt: true,
      owner: { select: { username: true, displayName: true } },
      category: { select: { title: true } },
    },
  });
}

export async function setAdminEventCatalogVisible(
  eventId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return { ok: false, reason: "not_found" };
  await db.event.update({
    where: { id: event.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
