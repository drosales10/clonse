import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getGroupDetail } from "@/server/groups/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
): Promise<Response> {
  const { groupId } = await params;
  const viewer = await getCurrentUser();
  const group = await getGroupDetail(viewer?.id ?? null, groupId);
  return group ? Response.json(group) : Response.json({ code: "GROUP_NOT_FOUND" }, { status: 404 });
}
