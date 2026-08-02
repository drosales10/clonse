import type { EventSort, EventView } from "@domain/events";

export function buildEventsCatalogHref(input: {
  page?: number;
  categoryId?: string | null;
  sort?: EventSort;
  view?: EventView;
  layout?: "grid" | "list";
}): string {
  const params = new URLSearchParams();
  if (input.view && input.view !== "all") params.set("view", input.view);
  if (input.sort && input.sort !== "created") params.set("sort", input.sort);
  if (input.categoryId) params.set("categoryId", input.categoryId);
  if (input.layout === "list") params.set("layout", "list");
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/events${query ? `?${query}` : ""}#events-catalog`;
}

export function formatEventDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatEventDateTime(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function eventLocationLabel(location: string | null, host: string | null): string {
  const parts = [location, host].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
