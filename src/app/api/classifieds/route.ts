import { NextRequest } from "next/server";

import { normalizeClassifiedQuery, type ClassifiedSort } from "@domain/classifieds";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedCatalog } from "@/server/classifieds/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeClassifiedQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    search: url.searchParams.get("search") ?? "",
    categoryId: url.searchParams.get("categoryId"),
    sort: parseSort(url.searchParams.get("sort")),
  });
  const viewer = await getCurrentUser();
  const result = await getClassifiedCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}

function parseSort(value: string | null): ClassifiedSort | undefined {
  return value === "updated" || value === "views" || value === "comments" || value === "created" ? value : undefined;
}
