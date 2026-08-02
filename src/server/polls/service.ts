import { Prisma } from "@prisma/client";

import {
  POLL_PAGE_SIZE,
  buildPollOptionResults,
  canReadPoll,
  normalizePollQuery,
  parsePollOptions,
  type PollCatalogQuery,
  type PollCatalogResult,
  type PublicPoll,
  type PublicPollDetail,
} from "@domain/polls";
import { db } from "@/server/db/client";

const pollSelect = {
  id: true,
  legacyId: true,
  title: true,
  description: true,
  options: true,
  createdAt: true,
  updatedAt: true,
  searchable: true,
  catalogVisible: true,
  closed: true,
  totalVotes: true,
  views: true,
  ownerId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
} satisfies Prisma.PollSelect;

type PollRow = Prisma.PollGetPayload<{ select: typeof pollSelect }>;

export async function getPollCatalog(
  viewerId: string | null,
  input: Partial<PollCatalogQuery> = {},
): Promise<PollCatalogResult> {
  const query = normalizePollQuery(input);
  const orderBy =
    query.sort === "votes"
      ? ([{ totalVotes: "desc" }, { id: "asc" }] as const)
      : query.sort === "views"
        ? ([{ views: "desc" }, { id: "asc" }] as const)
        : ([{ createdAt: "desc" }, { id: "asc" }] as const);

  const rows = await db.poll.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      owner: { enabled: true },
    },
    orderBy: [...orderBy],
    select: pollSelect,
  });

  const visible = rows.filter((row) => canReadPoll(row.ownerId, row.catalogVisible, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / POLL_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * POLL_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + POLL_PAGE_SIZE).map(toPublicPoll);

  return {
    items,
    pagination: {
      page,
      pageSize: POLL_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + POLL_PAGE_SIZE, visible.length),
    },
  };
}

export async function getPollDetail(
  viewerId: string | null,
  identifier: string,
): Promise<PublicPollDetail | null> {
  const row = await findPollRow(identifier);
  if (!row || !canReadPoll(row.ownerId, row.catalogVisible, viewerId)) return null;

  const options = parsePollOptions(row.options);
  const voteGroups = await db.pollVote.groupBy({
    by: ["optionIndex"],
    where: { pollId: row.id },
    _count: { _all: true },
  });
  const voteCounts = options.map((_, index) => {
    const found = voteGroups.find((group) => group.optionIndex === index);
    return found?._count._all ?? 0;
  });
  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);

  const viewerVote = viewerId
    ? await db.pollVote.findUnique({
        where: { pollId_userId: { pollId: row.id, userId: viewerId } },
        select: { optionIndex: true },
      })
    : null;

  const viewerHasVoted = viewerVote !== null;
  const isOwner = viewerId === row.ownerId;
  const canVote = Boolean(viewerId) && !row.closed && !viewerHasVoted && options.length > 0;

  return {
    ...toPublicPoll(row),
    description: toSafeText(row.description),
    catalogVisible: row.catalogVisible,
    totalVotes,
    options: buildPollOptionResults(options, voteCounts, totalVotes),
    viewerHasVoted,
    viewerOptionIndex: viewerVote?.optionIndex ?? null,
    canVote,
    isOwner,
  };
}

export type CreatePollResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" };

export async function createPoll(
  ownerId: string,
  input: { title: string; description: string | null; options: string[] },
): Promise<CreatePollResult> {
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { id: true, enabled: true, verifiedAt: true },
  });
  if (!owner?.enabled || !owner.verifiedAt) return { ok: false, reason: "unauthorized" };

  const now = new Date();
  const poll = await db.poll.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      options: input.options,
      createdAt: now,
      searchable: true,
      catalogVisible: true,
      closed: false,
      totalVotes: 0,
      views: 0,
    },
    select: { id: true },
  });

  return { ok: true, id: poll.id };
}

export type CloseOwnPollResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "already_closed" };

export async function closeOwnPoll(ownerId: string, pollId: string): Promise<CloseOwnPollResult> {
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { id: true, ownerId: true, closed: true },
  });
  if (!poll) return { ok: false, reason: "not_found" };
  if (poll.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  if (poll.closed) return { ok: false, reason: "already_closed" };

  await db.poll.update({ where: { id: poll.id }, data: { closed: true } });
  return { ok: true };
}

export type UpdatePollResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export type UpdatePollOptionsResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "has_votes" | "closed" };

export async function updateOwnPoll(
  ownerId: string,
  pollId: string,
  input: { title: string; description: string | null },
): Promise<UpdatePollResult> {
  const poll = await db.poll.findUnique({ where: { id: pollId }, select: { id: true, ownerId: true } });
  if (!poll) return { ok: false, reason: "not_found" };
  if (poll.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  await db.poll.update({
    where: { id: poll.id },
    data: { title: input.title, description: input.description, updatedAt: new Date() },
  });
  return { ok: true };
}

export async function updateOwnPollOptions(
  ownerId: string,
  pollId: string,
  options: string[],
): Promise<UpdatePollOptionsResult> {
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { id: true, ownerId: true, closed: true, totalVotes: true },
  });
  if (!poll) return { ok: false, reason: "not_found" };
  if (poll.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  if (poll.closed) return { ok: false, reason: "closed" };
  if (poll.totalVotes > 0) return { ok: false, reason: "has_votes" };

  const voteCount = await db.pollVote.count({ where: { pollId: poll.id } });
  if (voteCount > 0) return { ok: false, reason: "has_votes" };

  await db.poll.update({
    where: { id: poll.id },
    data: { options, updatedAt: new Date() },
  });
  return { ok: true };
}

export type SetPollVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnPollCatalogVisible(
  ownerId: string,
  pollId: string,
  catalogVisible: boolean,
): Promise<SetPollVisibleResult> {
  const poll = await db.poll.findUnique({ where: { id: pollId }, select: { id: true, ownerId: true } });
  if (!poll) return { ok: false, reason: "not_found" };
  if (poll.ownerId !== ownerId) return { ok: false, reason: "forbidden" };
  await db.poll.update({
    where: { id: poll.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined, updatedAt: new Date() },
  });
  return { ok: true };
}

export type PollVoteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "closed" | "already_voted" | "invalid_option" | "unauthorized" };

export async function castPollVote(
  viewerId: string,
  pollId: string,
  optionIndex: number,
): Promise<PollVoteResult> {
  const row = await db.poll.findFirst({
    where: { id: pollId, owner: { enabled: true } },
    select: {
      id: true,
      ownerId: true,
      catalogVisible: true,
      closed: true,
      options: true,
    },
  });

  if (!row || !canReadPoll(row.ownerId, row.catalogVisible, viewerId)) {
    return { ok: false, reason: "not_found" };
  }
  if (row.closed) return { ok: false, reason: "closed" };

  const options = parsePollOptions(row.options);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
    return { ok: false, reason: "invalid_option" };
  }

  const existing = await db.pollVote.findUnique({
    where: { pollId_userId: { pollId: row.id, userId: viewerId } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_voted" };

  try {
    await db.$transaction([
      db.pollVote.create({
        data: { pollId: row.id, userId: viewerId, optionIndex },
      }),
      db.poll.update({
        where: { id: row.id },
        data: { totalVotes: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_voted" };
    }
    throw error;
  }

  return { ok: true };
}

async function findPollRow(identifier: string): Promise<PollRow | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;
  const legacyId = /^\d+$/.test(normalizedIdentifier) ? Number(normalizedIdentifier) : null;
  return db.poll.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: normalizedIdentifier },
            ...(legacyId !== null && legacyId > 0 ? [{ legacyId }] : []),
          ],
        },
        { owner: { enabled: true } },
      ],
    },
    select: pollSelect,
  });
}

function toPublicPoll(row: PollRow): PublicPoll {
  const options = parsePollOptions(row.options);
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    description: toSafeText(row.description),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    closed: row.closed,
    totalVotes: row.totalVotes,
    views: row.views,
    optionCount: options.length,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
  };
}

function toSafeText(value: string | null): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
  return text || null;
}
