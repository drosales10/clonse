export const ALBUM_PAGE_SIZE = 10;
export const ALBUM_MAX_PAGE = 10_000;
export const ALBUM_MEDIA_PAGE_SIZE = 20;
export const ALBUM_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALBUM_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"] as const;
export const ALBUM_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AlbumSort = "created" | "updated";
export type AlbumAllowedExtension = (typeof ALBUM_ALLOWED_EXTENSIONS)[number];
export type AlbumAllowedMimeType = (typeof ALBUM_ALLOWED_MIME_TYPES)[number];

export interface AlbumCatalogQuery {
  page: number;
  sort: AlbumSort;
}

export interface AlbumCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicAlbumOwner {
  username: string;
  displayName: string;
}

export interface PublicAlbumMedia {
  id: string;
  title: string;
  description: string | null;
  extension: string;
  filesize: number;
  mimeType: string | null;
  hasFile: boolean;
  sortOrder: number;
}

export interface PublicAlbum {
  id: string;
  legacyId: number | null;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  totalFiles: number;
  coverMediaId: string | null;
  isOwn: boolean;
  owner: PublicAlbumOwner;
}

export interface PublicAlbumDetail extends PublicAlbum {
  media: PublicAlbumMedia[];
  mediaPagination: AlbumCatalogPagination;
  catalogVisible: boolean;
  isOwner: boolean;
}

export interface AlbumCatalogResult {
  items: PublicAlbum[];
  pagination: AlbumCatalogPagination;
}

export type AlbumCreateFormState = {
  errors?: { form?: string[]; title?: string[]; description?: string[] };
  message?: string;
  success?: boolean;
};

export type AlbumUploadFormState = {
  errors?: { form?: string[]; file?: string[]; title?: string[] };
  message?: string;
  success?: boolean;
};

export type AlbumManageFormState = AlbumCreateFormState;

export function normalizeAlbumQuery(input: Partial<AlbumCatalogQuery>): AlbumCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), ALBUM_MAX_PAGE);
  const sort: AlbumSort = input.sort === "updated" ? "updated" : "created";
  return { page, sort };
}

export function canReadAlbum(ownerId: string, catalogVisible: boolean, viewerId: string | null): boolean {
  return viewerId === ownerId || catalogVisible;
}

export function albumCreateInputFromFormData(formData: FormData): {
  title: string;
  description: string;
  catalogVisible: boolean;
} {
  const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
  const description =
    typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
  const visibility = typeof formData.get("catalogVisible") === "string" ? formData.get("catalogVisible") : "1";
  return { title, description, catalogVisible: visibility !== "0" };
}

export function validateAlbumCreateInput(input: {
  title: string;
  description: string;
  catalogVisible?: boolean;
}):
  | { success: true; data: { title: string; description: string | null; catalogVisible: boolean } }
  | { success: false; errors: NonNullable<AlbumCreateFormState["errors"]> } {
  const errors: NonNullable<AlbumCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.description.length > 1000) {
    errors.description = ["La descripción no puede superar 1000 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      title: input.title,
      description: input.description || null,
      catalogVisible: input.catalogVisible !== false,
    },
  };
}

export const albumWriteInputFromFormData = albumCreateInputFromFormData;
export const validateAlbumWriteInput = validateAlbumCreateInput;

export function normalizeAlbumExtension(filename: string): AlbumAllowedExtension | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return ext === "jpeg" ? "jpeg" : "jpg";
  if (ext === "png" || ext === "gif" || ext === "webp") return ext;
  return null;
}

export function isAlbumAllowedMimeType(value: string): value is AlbumAllowedMimeType {
  return (ALBUM_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export function extensionForMime(mime: AlbumAllowedMimeType): AlbumAllowedExtension {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
  }
}

export function mimeForExtension(extension: AlbumAllowedExtension): AlbumAllowedMimeType {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
  }
}
