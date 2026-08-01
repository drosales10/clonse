import { NextRequest } from "next/server";

import { normalizeBlogQuery, type BlogSort } from "@domain/blogs";
import { getCurrentUser } from "@/server/auth/session";
import { getBlogCatalog } from "@/server/blogs/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeBlogQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    search: url.searchParams.get("search") ?? "",
    categoryId: url.searchParams.get("categoryId"),
    sort: parseSort(url.searchParams.get("sort")),
  });
  const viewer = await getCurrentUser();
  const result = await getBlogCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}

function parseSort(value: string | null): BlogSort | undefined {
  return value === "views" || value === "created" ? value : undefined;
}
