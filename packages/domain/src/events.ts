export const EVENT_PAGE_SIZE = 10;
export const EVENT_MAX_PAGE = 10_000;

export const EVENT_ACCESS = {
  OWNER: 1,
  REGISTERED: 32,
  ANONYMOUS: 64,
} as const;

export const EVENT_RSVP = {
  NOT_ATTENDING: 0,
  MAYBE: 1,
  ATTENDING: 2,
} as const;

export type EventRsvpValue = (typeof EVENT_RSVP)[keyof typeof EVENT_RSVP];

export const EVENT_MEMBER_STATUS = {
  INVITED: 0,
  ACTIVE: 1,
} as const;

export type EventMembershipState = "none" | "member" | "owner" | "invited";

export const ATTENDEE_LIST_PAGE_SIZE = 10;
export const ATTENDEE_LIST_MAX_PAGE = 10_000;

export type AttendeeFilter = "all" | "attending" | "maybe";

export interface PublicEventAttendeeRow {
  user: { username: string; displayName: string };
  rsvp: EventRsvpValue;
  joinedAt: Date;
}

export interface EventAttendeeListResult {
  items: PublicEventAttendeeRow[];
  pagination: EventCatalogPagination;
}

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
  catalogVisible: boolean;
  views: number;
  owner: PublicEventOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicEventDetail extends PublicEvent {
  description: string | null;
  categoryId: string | null;
  isOwner: boolean;
  attendeeCount: number;
  maybeCount: number;
  membership: EventMembershipState;
  viewerRsvp: EventRsvpValue | null;
  canRsvp: boolean;
  canAcceptInvite: boolean;
}

export interface EventCatalogResult {
  items: PublicEvent[];
  pagination: EventCatalogPagination;
  categories: Array<{ id: string; legacyId: number | null; title: string; parentId: string | null }>;
}

export type EventCreateFormState = {
  errors?: {
    form?: string[];
    title?: string[];
    description?: string[];
    host?: string[];
    location?: string[];
    startsAt?: string[];
    endsAt?: string[];
    categoryId?: string[];
  };
  message?: string;
  success?: boolean;
};

export type EventManageFormState = EventCreateFormState;

export type EventRsvpFormState = {
  errors?: { form?: string[]; rsvp?: string[]; username?: string[] };
  message?: string;
  success?: boolean;
};

export function normalizeAttendeeListPage(page: unknown): number {
  const requested = Number.isInteger(page) ? Number(page) : 1;
  return Math.min(Math.max(requested, 1), ATTENDEE_LIST_MAX_PAGE);
}

export function normalizeAttendeeFilter(value: unknown): AttendeeFilter {
  return value === "attending" || value === "maybe" ? value : "all";
}

export function canViewerReadEvent(
  ownerId: string,
  privacy: number,
  inviteOnly: boolean,
  catalogVisible: boolean,
  viewerId: string | null,
  membership: { approved: boolean; status: number } | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (inviteOnly) {
    if (!membership) return false;
    if (!membership.approved) return false;
    return (
      membership.status === EVENT_MEMBER_STATUS.ACTIVE ||
      membership.status === EVENT_MEMBER_STATUS.INVITED
    );
  }
  return canReadEvent(ownerId, privacy, false, catalogVisible, viewerId);
}

export function resolveEventMembership(
  isOwner: boolean,
  row: { approved: boolean; status: number; rsvp: number } | null,
): EventMembershipState {
  if (isOwner) return "owner";
  if (!row) return "none";
  if (row.status === EVENT_MEMBER_STATUS.INVITED && row.approved) return "invited";
  if (row.status === EVENT_MEMBER_STATUS.ACTIVE && row.approved) return "member";
  return "none";
}

export function eventRsvpFromFormData(formData: FormData): {
  eventId: string;
  rsvp: number | null;
} {
  const eventId = typeof formData.get("eventId") === "string" ? String(formData.get("eventId")).trim() : "";
  const raw = formData.get("rsvp");
  const rsvp = typeof raw === "string" && /^-?\d+$/.test(raw) ? Number(raw) : null;
  return { eventId, rsvp };
}

export function validateEventRsvpInput(rsvp: number | null): EventRsvpFormState["errors"] | null {
  if (rsvp === null) return { rsvp: ["Selecciona una respuesta válida."] };
  const valid = [EVENT_RSVP.NOT_ATTENDING, EVENT_RSVP.MAYBE, EVENT_RSVP.ATTENDING];
  if (!valid.includes(rsvp as EventRsvpValue)) {
    return { rsvp: ["Selecciona una respuesta válida."] };
  }
  return null;
}

export function inviteUsernameFromFormData(formData: FormData): { username: string } {
  const username = typeof formData.get("username") === "string" ? String(formData.get("username")).trim() : "";
  return { username };
}

export function validateInviteUsername(input: { username: string }): EventRsvpFormState["errors"] | null {
  if (!input.username || input.username.length > 64) {
    return { username: ["Indica un nombre de usuario válido."] };
  }
  return null;
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
  catalogVisible: boolean,
  viewerId: string | null,
): boolean {
  if (viewerId === ownerId) return true;
  if (!catalogVisible) return false;
  if (inviteOnly) return false;
  const viewerAccess = viewerId === null ? EVENT_ACCESS.ANONYMOUS : EVENT_ACCESS.REGISTERED;
  return Number.isInteger(privacy) && (privacy & viewerAccess) !== 0;
}

export function eventWriteInputFromFormData(formData: FormData): {
  title: string;
  description: string;
  host: string;
  location: string;
  startsAt: string;
  endsAt: string;
  categoryId: string | null;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  const rawCategory = read("categoryId");
  return {
    title: read("title"),
    description: read("description"),
    host: read("host"),
    location: read("location"),
    startsAt: read("startsAt"),
    endsAt: read("endsAt"),
    categoryId: rawCategory || null,
  };
}

function parseOptionalDate(value: string): Date | null | "invalid" {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid";
  return date;
}

export function validateEventWriteInput(input: {
  title: string;
  description: string;
  host: string;
  location: string;
  startsAt: string;
  endsAt: string;
  categoryId: string | null;
}):
  | {
      success: true;
      data: {
        title: string;
        description: string | null;
        host: string | null;
        location: string | null;
        startsAt: Date | null;
        endsAt: Date | null;
        categoryId: string | null;
      };
    }
  | { success: false; errors: NonNullable<EventCreateFormState["errors"]> } {
  const errors: NonNullable<EventCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.description.length > 2000) {
    errors.description = ["La descripción no puede superar 2000 caracteres."];
  }
  if (input.host.length > 120) {
    errors.host = ["El host no puede superar 120 caracteres."];
  }
  if (input.location.length > 200) {
    errors.location = ["La ubicación no puede superar 200 caracteres."];
  }

  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);
  if (startsAt === "invalid") errors.startsAt = ["Fecha de inicio no válida."];
  if (endsAt === "invalid") errors.endsAt = ["Fecha de fin no válida."];
  if (startsAt instanceof Date && endsAt instanceof Date && endsAt < startsAt) {
    errors.endsAt = ["La fecha de fin debe ser posterior al inicio."];
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      title: input.title,
      description: input.description || null,
      host: input.host || null,
      location: input.location || null,
      startsAt: startsAt instanceof Date ? startsAt : null,
      endsAt: endsAt instanceof Date ? endsAt : null,
      categoryId: input.categoryId,
    },
  };
}

/** Formatea Date a valor datetime-local (local). */
export function toDatetimeLocalValue(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
