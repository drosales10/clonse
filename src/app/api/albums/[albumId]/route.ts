import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getAlbumDetail } from "@/server/albums/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ albumId: string }> },
): Promise<Response> {
  const { albumId } = await context.params;
  const rawPage = Number(request.nextUrl.searchParams.get("mediaPage"));
  const viewer = await getCurrentUser();
  const result = await getAlbumDetail(
    viewer?.id ?? null,
    albumId,
    Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  );
  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(result);
}
