import { NextRequest } from "next/server";

import { normalizeGroupQuery } from "@domain/groups";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupCatalog } from "@/server/groups/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeGroupQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    categoryId: url.searchParams.get("categoryId"),
  });
  const viewer = await getCurrentUser();
  const result = await getGroupCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}
