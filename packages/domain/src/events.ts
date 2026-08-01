export const EVENT_PAGE_SIZE = 10;
export const EVENT_MAX_PAGE = 10_000;

export const EVENT_ACCESS = {
  OWNER: 1,
  REGISTERED: 32,
  ANONYMOUS: 64,
} as const;

export type EventSort = "created" | "startsAt" | "endsAt";
export type EventView = "all" | "upcoming";

export interface EventCatalogQuery {
  page: number;
  categoryId: string | null;
  sort: EventSort;
  view: EventView;
}

export interface EventCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicEventOwner {
  username: string;
  displayName: string;
}

export interface PublicEvent {
  id: string;
  legacyId: number | null;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  inviteOnly: boolean;
  views: number;
  owner: PublicEventOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicEventDetail extends PublicEvent {
  description: string | null;
}

export interface EventCatalogResult {
  items: PublicEvent[];
  pagination: EventCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export function normalizeEventQuery(input: Partial<EventCatalogQuery>): EventCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), EVENT_MAX_PAGE);
  const categoryId = typeof input.categoryId === "string" && input.categoryId.length > 0 ? input.categoryId : null;
  const sort: EventSort = input.sort === "startsAt" || input.sort === "endsAt" ? input.sort : "created";
  const view: EventView = input.view === "upcoming" ? "upcoming" : "all";
  return { page, categoryId, sort, view };
}

export function canReadEvent(
  ownerId: string,
  privacy: number,
  inviteOnly: boolean,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (inviteOnly) return false;
  const viewerAccess = viewerId === null ? EVENT_ACCESS.ANONYMOUS : EVENT_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}
