import { NextRequest } from "next/server";

import { normalizeBusinessQuery, type BusinessSort } from "@domain/businesses";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessCatalog } from "@/server/businesses/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const sort = parseSort(url.searchParams.get("sort"));
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeBusinessQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    search: url.searchParams.get("search") ?? "",
    categoryId: url.searchParams.get("categoryId"),
    sort,
  });
  const viewer = await getCurrentUser();
  const result = await getBusinessCatalog(viewer?.id ?? null, query);

  return Response.json({
    items: result.items,
    pagination: result.pagination,
    categories: result.categories,
  });
}

function parseSort(value: string | null): BusinessSort | undefined {
  return value === "updated" || value === "rating" || value === "views" || value === "comments" || value === "created"
    ? value
    : undefined;
}
