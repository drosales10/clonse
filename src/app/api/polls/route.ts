import { NextRequest } from "next/server";

import { normalizePollQuery } from "@domain/polls";
import { getCurrentUser } from "@/server/auth/session";
import { getPollCatalog } from "@/server/polls/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const sort = url.searchParams.get("sort");
  const query = normalizePollQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    sort: sort === "votes" || sort === "views" ? sort : "created",
  });
  const viewer = await getCurrentUser();
  const result = await getPollCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}
