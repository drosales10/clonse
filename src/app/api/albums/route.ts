import { NextRequest } from "next/server";

import { normalizeAlbumQuery } from "@domain/albums";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumCatalog } from "@/server/albums/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const sort = url.searchParams.get("sort");
  const query = normalizeAlbumQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    sort: sort === "updated" ? "updated" : "created",
  });
  const viewer = await getCurrentUser();
  const result = await getAlbumCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}
