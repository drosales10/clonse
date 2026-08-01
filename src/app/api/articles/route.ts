import { NextRequest } from "next/server";

import { normalizeArticleQuery, type ArticleSort } from "@domain/articles";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleCatalog } from "@/server/articles/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeArticleQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    search: url.searchParams.get("search") ?? "",
    categoryId: url.searchParams.get("categoryId"),
    featured: url.searchParams.get("featured") === "1",
    sort: parseSort(url.searchParams.get("sort")),
  });
  const viewer = await getCurrentUser();
  const result = await getArticleCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}

function parseSort(value: string | null): ArticleSort | undefined {
  return value === "views" || value === "title" || value === "created" ? value : undefined;
}
