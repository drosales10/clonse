import { db } from "@/server/db/client";

export type AdminAlbumMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminAlbumRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  totalFiles: number;
  views: number;
  createdAt: Date;
  owner: { username: string; displayName: string };
}

export async function listAdminAlbums(): Promise<AdminAlbumRow[]> {
  return db.album.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      catalogVisible: true,
      searchable: true,
      totalFiles: true,
      views: true,
      createdAt: true,
      owner: { select: { username: true, displayName: true } },
    },
  });
}

export async function setAdminAlbumCatalogVisible(
  albumId: string,
  catalogVisible: boolean,
): Promise<AdminAlbumMutationResult> {
  const album = await db.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) return { ok: false, reason: "not_found" };
  await db.album.update({
    where: { id: album.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
