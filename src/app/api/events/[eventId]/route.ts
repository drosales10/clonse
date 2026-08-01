import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getEventDetail } from "@/server/events/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<Response> {
  const { eventId } = await params;
  const viewer = await getCurrentUser();
  const event = await getEventDetail(viewer?.id ?? null, eventId);
  return event ? Response.json(event) : Response.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });
}
