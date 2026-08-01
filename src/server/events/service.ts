import { Prisma } from "@prisma/client";

import {
  EVENT_PAGE_SIZE,
  canReadEvent,
  normalizeEventQuery,
  type EventCatalogQuery,
  type EventCatalogResult,
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
  inviteOnly: true,
  views: true,
  ownerId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.EventSelect;

type EventRow = Prisma.EventGetPayload<{ select: typeof eventSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function getEventCatalog(
  viewerId: string | null,
  input: Partial<EventCatalogQuery> = {},
): Promise<EventCatalogResult> {
  const query = normalizeEventQuery(input);
  const categories = await db.eventCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const now = new Date();

  const rows = await db.event.findMany({
    where: {
      searchable: true,
      owner: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.view === "upcoming" ? { startsAt: { gt: now } } : {}),
    },
    orderBy: eventOrder(query.sort, query.view),
    select: eventSelect,
  });

  const visible = rows.filter((row) => canReadEvent(row.ownerId, row.privacy, row.inviteOnly, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / EVENT_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * EVENT_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + EVENT_PAGE_SIZE).map(toPublicEvent);

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

function eventOrder(sort: EventCatalogQuery["sort"], view: EventCatalogQuery["view"]): Prisma.EventOrderByWithRelationInput[] {
  if (view === "upcoming") return [{ startsAt: "asc" }, { id: "asc" }];
  const primary: Prisma.EventOrderByWithRelationInput = sort === "startsAt"
    ? { startsAt: "asc" }
    : sort === "endsAt"
      ? { endsAt: "asc" }
      : { createdAt: "desc" };
  return [primary, { id: "asc" }];
}

function toPublicEvent(row: EventRow): PublicEvent {
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
    views: row.views,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
    category: row.category,
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

  if (!row || !canReadEvent(row.ownerId, row.privacy, row.inviteOnly, viewerId)) return null;

  return {
    ...toPublicEvent(row),
    description: toSafeText(row.description),
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
