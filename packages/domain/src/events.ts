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
  catalogVisible: boolean;
  views: number;
  owner: PublicEventOwner;
  category: { id: string; legacyId: number | null; title: string } | null;
}

export interface PublicEventDetail extends PublicEvent {
  description: string | null;
  categoryId: string | null;
  isOwner: boolean;
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
