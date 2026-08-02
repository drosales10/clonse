import { getCurrentUser } from "@/server/auth/session";
import { getPollDetail } from "@/server/polls/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ pollId: string }> },
): Promise<Response> {
  const { pollId } = await context.params;
  const viewer = await getCurrentUser();
  const result = await getPollDetail(viewer?.id ?? null, pollId);
  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(result);
}
