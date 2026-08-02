import type { BusinessSort } from "@domain/businesses";

export function buildBusinessesCatalogHref(input: {
  page?: number;
  search?: string;
  categoryId?: string | null;
  sort?: BusinessSort;
  layout?: "grid" | "list";
}): string {
  const params = new URLSearchParams();
  if (input.search) params.set("search", input.search);
  if (input.sort && input.sort !== "created") params.set("sort", input.sort);
  if (input.categoryId) params.set("categoryId", input.categoryId);
  if (input.layout === "list") params.set("layout", "list");
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/businesses${query ? `?${query}` : ""}#businesses-catalog`;
}

export function formatBusinessDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatBusinessDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function locationLabel(city: string | null, province: string | null, country?: string | null): string {
  const parts = [city, province, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}
