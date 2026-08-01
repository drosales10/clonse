import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getBlogEntryDetail } from "@/server/blogs/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ entryId: string }> }): Promise<Response> {
  const { entryId } = await params;
  const viewer = await getCurrentUser();
  const entry = await getBlogEntryDetail(viewer?.id ?? null, entryId);
  return entry ? Response.json(entry) : Response.json({ code: "BLOG_ENTRY_NOT_FOUND" }, { status: 404 });
}
