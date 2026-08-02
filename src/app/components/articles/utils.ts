import type { ArticleSort } from "@domain/articles";

export function buildArticlesCatalogHref(input: {
  page?: number;
  search?: string;
  categoryId?: string | null;
  sort?: ArticleSort;
  featured?: boolean;
  layout?: "grid" | "list";
}): string {
  const params = new URLSearchParams();
  if (input.search) params.set("search", input.search);
  if (input.sort && input.sort !== "created") params.set("sort", input.sort);
  if (input.categoryId) params.set("categoryId", input.categoryId);
  if (input.featured) params.set("featured", "1");
  if (input.layout === "list") params.set("layout", "list");
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/articles${query ? `?${query}` : ""}#articles-catalog`;
}

export function formatArticleDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatArticleDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}
