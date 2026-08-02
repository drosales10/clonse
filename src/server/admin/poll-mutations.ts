import { db } from "@/server/db/client";

export type AdminPollMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminPollRow {
  id: string;
  title: string;
  closed: boolean;
  catalogVisible: boolean;
  searchable: boolean;
  totalVotes: number;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
}

export async function listAdminPolls(): Promise<AdminPollRow[]> {
  return db.poll.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      closed: true,
      catalogVisible: true,
      searchable: true,
      totalVotes: true,
      views: true,
      createdAt: true,
      owner: { select: { username: true, displayName: true } },
    },
  });
}

export async function setAdminPollClosed(
  pollId: string,
  closed: boolean,
): Promise<AdminPollMutationResult> {
  const poll = await db.poll.findUnique({ where: { id: pollId }, select: { id: true } });
  if (!poll) return { ok: false, reason: "not_found" };
  await db.poll.update({ where: { id: poll.id }, data: { closed } });
  return { ok: true };
}

export async function setAdminPollCatalogVisible(
  pollId: string,
  catalogVisible: boolean,
): Promise<AdminPollMutationResult> {
  const poll = await db.poll.findUnique({ where: { id: pollId }, select: { id: true } });
  if (!poll) return { ok: false, reason: "not_found" };
  await db.poll.update({
    where: { id: poll.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
