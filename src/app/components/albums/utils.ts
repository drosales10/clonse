import type { AlbumSort } from "@domain/albums";

export function albumMediaSrc(albumId: string, mediaId: string): string {
  return `/api/albums/${encodeURIComponent(albumId)}/media/${encodeURIComponent(mediaId)}`;
}

export function albumCoverSrc(albumId: string, coverMediaId: string | null): string | null {
  if (!coverMediaId) return null;
  return albumMediaSrc(albumId, coverMediaId);
}

export function buildAlbumsCatalogHref(input: {
  page?: number;
  sort?: AlbumSort;
  view?: "grid" | "list";
}): string {
  const params = new URLSearchParams();
  if (input.sort === "updated") params.set("sort", "updated");
  if (input.view === "list") params.set("view", "list");
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/albums${query ? `?${query}` : ""}#albums-catalog`;
}

export function formatAlbumDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function formatAlbumDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}
