import { db } from "@/server/db/client";

export type AdminCatalogMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export interface AdminArticleRow {
  id: string;
  title: string;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  publishedAt: Date;
  author: { username: string; displayName: string };
  category: { title: string } | null;
}

export async function listAdminArticles(): Promise<AdminArticleRow[]> {
  return db.article.findMany({
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      publishedAt: true,
      author: { select: { username: true, displayName: true } },
      category: { select: { title: true } },
    },
  });
}

export async function setAdminArticleCatalogVisible(
  articleId: string,
  catalogVisible: boolean,
): Promise<AdminCatalogMutationResult> {
  const article = await db.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) return { ok: false, reason: "not_found" };
  await db.article.update({
    where: { id: article.id },
    data: { catalogVisible, searchable: catalogVisible ? true : undefined },
  });
  return { ok: true };
}
