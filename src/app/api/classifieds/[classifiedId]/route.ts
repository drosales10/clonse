import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedDetail } from "@/server/classifieds/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classifiedId: string }> },
): Promise<Response> {
  const { classifiedId } = await params;
  const viewer = await getCurrentUser();
  const classified = await getClassifiedDetail(viewer?.id ?? null, classifiedId);
  return classified
    ? Response.json(classified)
    : Response.json({ code: "CLASSIFIED_NOT_FOUND" }, { status: 404 });
}
