import { Prisma } from "@prisma/client";

import {
  EVENT_ACCESS,
  EVENT_MEMBER_STATUS,
  EVENT_PAGE_SIZE,
  EVENT_RSVP,
  ATTENDEE_LIST_PAGE_SIZE,
  canReadEvent,
  canViewerReadEvent,
  normalizeAttendeeFilter,
  normalizeAttendeeListPage,
  normalizeEventQuery,
  resolveEventMembership,
  type AttendeeFilter,
  type EventAttendeeListResult,
  type EventCatalogQuery,
  type EventCatalogResult,
  type EventRsvpValue,
  type PublicEvent,
  type PublicEventDetail,
} from "@domain/events";
import { db } from "@/server/db/client";

const eventSelect = {
  id: true,
  legacyId: true,
  title: true,
  description: true,
  host: true,
  location: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
  searchable: true,
  privacy: true,
  catalogVisible: true,
  inviteOnly: true,
  views: true,
  ownerId: true,
  categoryId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.EventSelect;

type EventRow = Prisma.EventGetPayload<{ select: typeof eventSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveEventCategories(): Promise<CategoryRow[]> {
  return db.eventCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getEventCatalog(
  viewerId: string | null,
  input: Partial<EventCatalogQuery> = {},
): Promise<EventCatalogResult> {
  const query = normalizeEventQuery(input);
  const categories = await listActiveEventCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const now = new Date();

  const rows = await db.event.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      owner: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.view === "upcoming" ? { startsAt: { gt: now } } : {}),
    },
    orderBy: eventOrder(query.sort, query.view),
    select: eventSelect,
  });

  const visible = rows.filter((row) =>
    canReadEvent(row.ownerId, row.privacy, row.inviteOnly, row.catalogVisible, viewerId),
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / EVENT_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * EVENT_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + EVENT_PAGE_SIZE).map((row) => toPublicEvent(row, viewerId));

  return {
    items,
    pagination: {
      page,
      pageSize: EVENT_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + EVENT_PAGE_SIZE, visible.length),
    },
    categories,
  };
}

export async function getEventDetail(
  viewerId: string | null,
  identifier: string,
): Promise<PublicEventDetail | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const legacyId = /^\d+$/.test(normalizedIdentifier) ? Number(normalizedIdentifier) : null;
  const row = await db.event.findFirst({
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
    select: eventSelect,
  });
  if (!row) return null;

  const membershipRow = viewerId
    ? await db.eventMember.findUnique({
        where: { eventId_userId: { eventId: row.id, userId: viewerId } },
        select: { rsvp: true, approved: true, status: true },
      })
    : null;

  if (!canViewerReadEvent(row.ownerId, row.privacy, row.inviteOnly, row.catalogVisible, viewerId, membershipRow)) {
    return null;
  }

  const isOwner = viewerId === row.ownerId;
  const [attendeeCount, maybeCount] = await Promise.all([
    db.eventMember.count({
      where: {
        eventId: row.id,
        status: EVENT_MEMBER_STATUS.ACTIVE,
        approved: true,
        rsvp: EVENT_RSVP.ATTENDING,
      },
    }),
    db.eventMember.count({
      where: {
        eventId: row.id,
        status: EVENT_MEMBER_STATUS.ACTIVE,
        approved: true,
        rsvp: EVENT_RSVP.MAYBE,
      },
    }),
  ]);

  const membership = resolveEventMembership(isOwner, membershipRow);
  const viewerRsvp =
    membershipRow &&
    membershipRow.status === EVENT_MEMBER_STATUS.ACTIVE &&
    membershipRow.approved
      ? (membershipRow.rsvp as EventRsvpValue)
      : null;
  const canAcceptInvite = membership === "invited";
  const canRsvp =
    Boolean(viewerId) &&
    membership !== "invited" &&
    (!row.inviteOnly || membership === "member" || isOwner);

  return {
    ...toPublicEvent(row, viewerId),
    description: toSafeText(row.description),
    categoryId: row.categoryId,
    isOwner,
    attendeeCount,
    maybeCount,
    membership,
    viewerRsvp,
    canRsvp,
    canAcceptInvite,
  };
}

export type CreateEventResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createEvent(
  ownerId: string,
  input: {
    title: string;
    description: string | null;
    host: string | null;
    location: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    categoryId: string | null;
  },
): Promise<CreateEventResult> {
  const owner = await requireActiveOwner(ownerId);
  if (!owner) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.eventCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const event = await db.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        ownerId: owner.id,
        title: input.title,
        description: input.description,
        host: input.host,
        location: input.location,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        categoryId: input.categoryId,
        createdAt: now,
        updatedAt: now,
        searchable: true,
        catalogVisible: true,
        privacy: EVENT_ACCESS.ANONYMOUS,
        inviteOnly: false,
        views: 0,
      },
      select: { id: true },
    });
    await tx.eventMember.create({
      data: {
        eventId: created.id,
        userId: owner.id,
        status: EVENT_MEMBER_STATUS.ACTIVE,
        approved: true,
        rsvp: EVENT_RSVP.ATTENDING,
      },
    });
    return created;
  });
  return { ok: true, id: event.id };
}

export type UpdateEventResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnEvent(
  ownerId: string,
  eventId: string,
  input: {
    title: string;
    description: string | null;
    host: string | null;
    location: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    categoryId: string | null;
  },
): Promise<UpdateEventResult> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true },
  });
  if (!event) return { ok: false, reason: "not_found" };
  if (event.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.eventCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.event.update({
    where: { id: event.id },
    data: {
      title: input.title,
      description: input.description,
      host: input.host,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetEventVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnEventCatalogVisible(
  ownerId: string,
  eventId: string,
  catalogVisible: boolean,
): Promise<SetEventVisibleResult> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true },
  });
  if (!event) return { ok: false, reason: "not_found" };
  if (event.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  await db.event.update({
    where: { id: event.id },
    data: {
      catalogVisible,
      searchable: catalogVisible ? true : undefined,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetEventRsvpResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "unauthorized" };

export async function setEventRsvp(
  viewerId: string,
  eventId: string,
  rsvp: EventRsvpValue,
): Promise<SetEventRsvpResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const event = await db.event.findFirst({
    where: { id: eventId, owner: { enabled: true } },
    select: { id: true, ownerId: true, privacy: true, inviteOnly: true, catalogVisible: true },
  });
  if (!event) return { ok: false, reason: "not_found" };

  const membershipRow = await db.eventMember.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: viewerId } },
    select: { approved: true, status: true, rsvp: true },
  });
  if (!canViewerReadEvent(event.ownerId, event.privacy, event.inviteOnly, event.catalogVisible, viewerId, membershipRow)) {
    return { ok: false, reason: "not_found" };
  }

  const membership = resolveEventMembership(event.ownerId === viewerId, membershipRow);
  if (event.inviteOnly && membership !== "member" && membership !== "owner") {
    return { ok: false, reason: "forbidden" };
  }

  if (rsvp === EVENT_RSVP.NOT_ATTENDING && event.ownerId !== viewerId) {
    await db.eventMember.deleteMany({ where: { eventId: event.id, userId: viewerId } });
    return { ok: true };
  }

  await db.eventMember.upsert({
    where: { eventId_userId: { eventId: event.id, userId: viewerId } },
    create: {
      eventId: event.id,
      userId: viewerId,
      status: EVENT_MEMBER_STATUS.ACTIVE,
      approved: true,
      rsvp,
    },
    update: { rsvp, status: EVENT_MEMBER_STATUS.ACTIVE, approved: true, updatedAt: new Date() },
  });
  return { ok: true };
}

export async function getEventAttendees(
  viewerId: string | null,
  eventId: string,
  pageInput: unknown,
  filterInput: unknown,
): Promise<EventAttendeeListResult | null> {
  const event = await db.event.findFirst({
    where: { id: eventId, owner: { enabled: true } },
    select: { id: true, ownerId: true, privacy: true, inviteOnly: true, catalogVisible: true },
  });
  if (!event) return null;

  const membershipRow = viewerId
    ? await db.eventMember.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: viewerId } },
        select: { approved: true, status: true },
      })
    : null;
  if (!canViewerReadEvent(event.ownerId, event.privacy, event.inviteOnly, event.catalogVisible, viewerId, membershipRow)) {
    return null;
  }

  const page = normalizeAttendeeListPage(pageInput);
  const filter = normalizeAttendeeFilter(filterInput);
  const where = {
    eventId: event.id,
    status: EVENT_MEMBER_STATUS.ACTIVE,
    approved: true,
    user: { enabled: true },
    ...(filter === "attending" ? { rsvp: EVENT_RSVP.ATTENDING } : {}),
    ...(filter === "maybe" ? { rsvp: EVENT_RSVP.MAYBE } : {}),
  };
  const total = await db.eventMember.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ATTENDEE_LIST_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * ATTENDEE_LIST_PAGE_SIZE;
  const rows = await db.eventMember.findMany({
    where,
    orderBy: [{ rsvp: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    skip: startIndex,
    take: ATTENDEE_LIST_PAGE_SIZE,
    select: {
      rsvp: true,
      createdAt: true,
      user: { select: { username: true, displayName: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      user: row.user,
      rsvp: row.rsvp as EventRsvpValue,
      joinedAt: row.createdAt,
    })),
    pagination: {
      page: safePage,
      pageSize: ATTENDEE_LIST_PAGE_SIZE,
      total,
      pageCount,
      start: total === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + ATTENDEE_LIST_PAGE_SIZE, total),
    },
  };
}

export type InviteEventMemberResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "user_not_found" | "already_member" };

export async function inviteEventMember(
  ownerId: string,
  eventId: string,
  username: string,
): Promise<InviteEventMemberResult> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true },
  });
  if (!event) return { ok: false, reason: "not_found" };
  if (event.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  const user = await db.user.findFirst({
    where: { username, enabled: true },
    select: { id: true },
  });
  if (!user) return { ok: false, reason: "user_not_found" };
  if (user.id === ownerId) return { ok: false, reason: "already_member" };

  const existing = await db.eventMember.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_member" };

  await db.eventMember.create({
    data: {
      eventId: event.id,
      userId: user.id,
      status: EVENT_MEMBER_STATUS.INVITED,
      approved: true,
      rsvp: EVENT_RSVP.ATTENDING,
    },
  });
  return { ok: true };
}

export type RespondEventInvitationResult =
  | { ok: true }
  | { ok: false; reason: "invalid_invitation" | "unauthorized" };

export async function acceptEventInvitation(
  viewerId: string,
  eventId: string,
): Promise<RespondEventInvitationResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const member = await db.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId: viewerId } },
    select: { id: true, status: true, approved: true },
  });
  if (!member || member.status !== EVENT_MEMBER_STATUS.INVITED || !member.approved) {
    return { ok: false, reason: "invalid_invitation" };
  }

  await db.eventMember.update({
    where: { id: member.id },
    data: { status: EVENT_MEMBER_STATUS.ACTIVE, updatedAt: new Date() },
  });
  return { ok: true };
}

export async function declineEventInvitation(
  viewerId: string,
  eventId: string,
): Promise<RespondEventInvitationResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const member = await db.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId: viewerId } },
    select: { id: true, status: true },
  });
  if (!member || member.status !== EVENT_MEMBER_STATUS.INVITED) {
    return { ok: false, reason: "invalid_invitation" };
  }

  await db.eventMember.delete({ where: { id: member.id } });
  return { ok: true };
}

async function requireActiveOwner(ownerId: string) {
  return db.user.findUnique({
    where: { id: ownerId },
    select: { id: true, enabled: true, verifiedAt: true },
  }).then((user) => (user?.enabled && user.verifiedAt ? user : null));
}

function resolveCategoryIds(categories: CategoryRow[], selectedId: string | null): string[] | null {
  if (!selectedId) return null;
  const selected = categories.find((category) => category.id === selectedId);
  if (!selected) return [];
  if (selected.parentId !== null) return [selected.id];

  const descendants = new Set([selected.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && descendants.has(category.parentId) && !descendants.has(category.id)) {
        descendants.add(category.id);
        changed = true;
      }
    }
  }
  return [...descendants];
}

function eventOrder(
  sort: EventCatalogQuery["sort"],
  view: EventCatalogQuery["view"],
): Prisma.EventOrderByWithRelationInput[] {
  if (view === "upcoming") return [{ startsAt: "asc" }, { id: "asc" }];
  const primary: Prisma.EventOrderByWithRelationInput =
    sort === "startsAt"
      ? { startsAt: "asc" }
      : sort === "endsAt"
        ? { endsAt: "asc" }
        : { createdAt: "desc" };
  return [primary, { id: "asc" }];
}

function toPublicEvent(row: EventRow, viewerId: string | null): PublicEvent {
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    description: row.description,
    host: row.host,
    location: row.location,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    inviteOnly: row.inviteOnly,
    catalogVisible: row.catalogVisible,
    views: row.views,
    isOwn: viewerId === row.ownerId,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
    category: row.category,
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
