import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import {
  ALBUM_MAX_UPLOAD_BYTES,
  ALBUM_MEDIA_PAGE_SIZE,
  ALBUM_PAGE_SIZE,
  canReadAlbum,
  extensionForMime,
  isAlbumAllowedMimeType,
  mimeForExtension,
  normalizeAlbumExtension,
  normalizeAlbumQuery,
  type AlbumAllowedExtension,
  type AlbumCatalogQuery,
  type AlbumCatalogResult,
  type PublicAlbum,
  type PublicAlbumDetail,
} from "@domain/albums";
import { db } from "@/server/db/client";
import { buildAlbumStorageKey, readAlbumMediaFile, writeAlbumMediaFile } from "@/server/albums/storage";

const albumSelect = {
  id: true,
  legacyId: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  searchable: true,
  catalogVisible: true,
  views: true,
  totalFiles: true,
  ownerId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
} satisfies Prisma.AlbumSelect;

type AlbumRow = Prisma.AlbumGetPayload<{ select: typeof albumSelect }>;

export async function getAlbumCatalog(
  viewerId: string | null,
  input: Partial<AlbumCatalogQuery> = {},
): Promise<AlbumCatalogResult> {
  const query = normalizeAlbumQuery(input);
  const rows = await db.album.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      owner: { enabled: true },
    },
    orderBy:
      query.sort === "updated"
        ? [{ updatedAt: "desc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }],
    select: albumSelect,
  });

  const visible = rows.filter((row) => canReadAlbum(row.ownerId, row.catalogVisible, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / ALBUM_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * ALBUM_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + ALBUM_PAGE_SIZE).map(toPublicAlbum);

  return {
    items,
    pagination: {
      page,
      pageSize: ALBUM_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + ALBUM_PAGE_SIZE, visible.length),
    },
  };
}

export async function getAlbumDetail(
  viewerId: string | null,
  identifier: string,
  mediaPage = 1,
): Promise<PublicAlbumDetail | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const legacyId = /^\d+$/.test(normalizedIdentifier) ? Number(normalizedIdentifier) : null;
  const row = await db.album.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: normalizedIdentifier },
            ...(legacyId !== null && legacyId > 0 ? [{ legacyId }] : []),
          ],
        },
        { owner: { enabled: true } },
      ],
    },
    select: albumSelect,
  });

  if (!row || !canReadAlbum(row.ownerId, row.catalogVisible, viewerId)) return null;

  const mediaRows = await db.albumMedia.findMany({
    where: { albumId: row.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      extension: true,
      filesize: true,
      mimeType: true,
      storageKey: true,
      sortOrder: true,
    },
  });

  const pageCount = Math.max(1, Math.ceil(mediaRows.length / ALBUM_MEDIA_PAGE_SIZE));
  const page = Math.min(Math.max(mediaPage, 1), pageCount);
  const startIndex = (page - 1) * ALBUM_MEDIA_PAGE_SIZE;
  const mediaPageItems = mediaRows.slice(startIndex, startIndex + ALBUM_MEDIA_PAGE_SIZE);

  return {
    ...toPublicAlbum(row),
    description: toSafeText(row.description),
    isOwner: viewerId === row.ownerId,
    media: mediaPageItems.map((item) => ({
      id: item.id,
      title: item.title || `Archivo ${item.sortOrder + 1}`,
      description: toSafeText(item.description),
      extension: item.extension,
      filesize: item.filesize,
      mimeType: item.mimeType,
      hasFile: Boolean(item.storageKey),
      sortOrder: item.sortOrder,
    })),
    mediaPagination: {
      page,
      pageSize: ALBUM_MEDIA_PAGE_SIZE,
      total: mediaRows.length,
      pageCount,
      start: mediaRows.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + ALBUM_MEDIA_PAGE_SIZE, mediaRows.length),
    },
  };
}

export type CreateAlbumResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" };

export async function createAlbum(
  ownerId: string,
  input: { title: string; description: string | null },
): Promise<CreateAlbumResult> {
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { id: true, enabled: true, verifiedAt: true },
  });
  if (!owner?.enabled || !owner.verifiedAt) return { ok: false, reason: "unauthorized" };

  const now = new Date();
  const album = await db.album.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      searchable: true,
      catalogVisible: true,
      views: 0,
      totalFiles: 0,
      sortOrder: 0,
    },
    select: { id: true },
  });

  return { ok: true, id: album.id };
}

export type UploadAlbumMediaResult =
  | { ok: true; mediaId: string }
  | {
      ok: false;
      reason:
        | "unauthorized"
        | "not_found"
        | "forbidden"
        | "invalid_file"
        | "too_large"
        | "unsupported_type";
    };

export async function uploadAlbumMedia(
  ownerId: string,
  albumId: string,
  input: {
    title: string;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
  },
): Promise<UploadAlbumMediaResult> {
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { id: true, enabled: true, verifiedAt: true },
  });
  if (!owner?.enabled || !owner.verifiedAt) return { ok: false, reason: "unauthorized" };

  const album = await db.album.findUnique({
    where: { id: albumId },
    select: { id: true, ownerId: true, totalFiles: true, coverMediaId: true },
  });
  if (!album) return { ok: false, reason: "not_found" };
  if (album.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  if (!input.bytes.length) return { ok: false, reason: "invalid_file" };
  if (input.bytes.byteLength > ALBUM_MAX_UPLOAD_BYTES) return { ok: false, reason: "too_large" };

  const fromMime = isAlbumAllowedMimeType(input.mimeType) ? input.mimeType : null;
  const fromName = normalizeAlbumExtension(input.fileName);
  if (!fromMime && !fromName) return { ok: false, reason: "unsupported_type" };

  const mime = fromMime ?? mimeForExtension(fromName as AlbumAllowedExtension);
  const extension: AlbumAllowedExtension = fromName ?? extensionForMime(mime);
  if (!isAlbumAllowedMimeType(mime)) return { ok: false, reason: "unsupported_type" };

  const title = input.title.trim().slice(0, 120);
  const mediaId = randomUUID();
  const storageKey = buildAlbumStorageKey(album.id, mediaId, extension);

  await writeAlbumMediaFile(storageKey, input.bytes);

  const now = new Date();
  await db.$transaction([
    db.albumMedia.create({
      data: {
        id: mediaId,
        albumId: album.id,
        title: title || input.fileName.slice(0, 120),
        extension,
        filesize: input.bytes.byteLength,
        mimeType: mime,
        storageKey,
        sortOrder: album.totalFiles,
        createdAt: now,
        updatedAt: now,
      },
    }),
    db.album.update({
      where: { id: album.id },
      data: {
        totalFiles: { increment: 1 },
        updatedAt: now,
        ...(album.coverMediaId ? {} : { coverMediaId: mediaId }),
      },
    }),
  ]);

  return { ok: true, mediaId };
}

export type AlbumMediaFileResult =
  | { ok: true; bytes: Buffer; mimeType: string; filename: string }
  | { ok: false; reason: "not_found" | "forbidden" | "missing_file" };

export async function getAlbumMediaFile(
  viewerId: string | null,
  albumId: string,
  mediaId: string,
): Promise<AlbumMediaFileResult> {
  const media = await db.albumMedia.findFirst({
    where: { id: mediaId, albumId },
    select: {
      id: true,
      title: true,
      extension: true,
      mimeType: true,
      storageKey: true,
      album: {
        select: {
          id: true,
          ownerId: true,
          catalogVisible: true,
          owner: { select: { enabled: true } },
        },
      },
    },
  });

  if (!media || !media.album.owner.enabled) return { ok: false, reason: "not_found" };
  if (!canReadAlbum(media.album.ownerId, media.album.catalogVisible, viewerId)) {
    return { ok: false, reason: "forbidden" };
  }
  if (!media.storageKey) return { ok: false, reason: "missing_file" };

  const bytes = await readAlbumMediaFile(media.storageKey);
  if (!bytes) return { ok: false, reason: "missing_file" };

  const mimeType = media.mimeType || "application/octet-stream";
  const filename = `${sanitizeFilename(media.title || media.id)}.${media.extension || "bin"}`;
  return { ok: true, bytes, mimeType, filename };
}

function sanitizeFilename(value: string): string {
  const cleaned = value.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
  return cleaned || "archivo";
}

function toPublicAlbum(row: AlbumRow): PublicAlbum {
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    description: toSafeText(row.description),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    views: row.views,
    totalFiles: row.totalFiles,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
  };
}

function toSafeText(value: string | null): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
  return text || null;
}
