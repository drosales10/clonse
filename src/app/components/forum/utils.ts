import type { PublicForumCategory, PublicForumInstance } from "@domain/forum";

export function buildForumInstanceHref(
  instanceId: string,
  input: { categoryId?: string | null; page?: number } = {},
): string {
  const params = new URLSearchParams();
  if (input.categoryId) params.set("categoryId", input.categoryId);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/forum/${encodeURIComponent(instanceId)}${query ? `?${query}` : ""}#forum-catalog`;
}

export function buildForumCategoryHref(instanceId: string, categoryId: string, page = 1): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(categoryId)}${query ? `?${query}` : ""}#forum-catalog`;
}

export function buildForumTopicHref(
  instanceId: string,
  topicId: string,
  categoryId: string,
  page = 1,
): string {
  const params = new URLSearchParams({ categoryId });
  if (page > 1) params.set("page", String(page));
  return `/forum/${encodeURIComponent(instanceId)}/topics/${encodeURIComponent(topicId)}?${params.toString()}#forum-topic`;
}

export function formatForumDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatForumDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function toExcerpt(value: string | null, max = 180): string | null {
  if (!value) return null;
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export function topicKindLabel(topic: {
  isAnnouncement: boolean;
  isSticky: boolean;
}): string {
  if (topic.isAnnouncement) return "Anuncio";
  if (topic.isSticky) return "Fijado";
  return "Tema";
}

export function matchesPublicIdentifier(id: string, legacyId: number | null, identifier: string): boolean {
  return id === identifier || (legacyId !== null && legacyId > 0 && String(legacyId) === identifier);
}

export type CategoryOption = Pick<PublicForumCategory, "id" | "title" | "parentId" | "legacyId">;
export type InstanceOption = Pick<PublicForumInstance, "id" | "name" | "description" | "legacyId">;
