import type { PollSort } from "@domain/polls";

export function buildPollsCatalogHref(input: {
  page?: number;
  sort?: PollSort;
  view?: "grid" | "list";
}): string {
  const params = new URLSearchParams();
  if (input.sort && input.sort !== "created") params.set("sort", input.sort);
  if (input.view === "list") params.set("view", "list");
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/polls${query ? `?${query}` : ""}#polls-catalog`;
}

export function formatPollDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatPollDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}
