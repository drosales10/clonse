import { NextResponse } from "next/server";

import { getAlbumMediaFile } from "@/server/albums/service";
import { getCurrentUser } from "@/server/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ albumId: string; mediaId: string }> },
) {
  const { albumId, mediaId } = await context.params;
  const viewer = await getCurrentUser();
  const result = await getAlbumMediaFile(viewer?.id ?? null, albumId, mediaId);

  if (!result.ok) {
    const status =
      result.reason === "forbidden" ? 403 : result.reason === "missing_file" ? 404 : 404;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return new NextResponse(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Content-Length": String(result.bytes.byteLength),
      "Content-Disposition": `inline; filename="${result.filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
