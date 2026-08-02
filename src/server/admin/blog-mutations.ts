import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminBlogRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  author: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminBlogs(): Promise<AdminBlogRow[]> {
  return db.blogEntry.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      createdAt: true,
      author: { select: { username: true, displayName: true } },
      category: { select: { title: true } },
    },
  });
}

export async function setAdminBlogCatalogVisible(
  entryId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const entry = await db.blogEntry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return { ok: false, reason: "not_found" };
  await db.blogEntry.update({
    where: { id: entry.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
