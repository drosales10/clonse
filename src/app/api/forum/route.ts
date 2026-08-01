import { NextRequest } from "next/server";

import { normalizeForumQuery } from "@domain/forum";
import { getForumCatalog, getForumTopic } from "@/server/forum/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const query = normalizeForumQuery({
    instanceId: url.searchParams.get("instanceId"),
    categoryId: url.searchParams.get("categoryId"),
    topicId: url.searchParams.get("topicId"),
    page: Number(url.searchParams.get("page")),
  });
  if (query.topicId) {
    const result = await getForumTopic(query);
    return result ? Response.json(result) : Response.json({ code: "RESOURCE_NOT_FOUND" }, { status: 404 });
  }
  const result = await getForumCatalog(query);
  if (query.instanceId && !result.instance) return Response.json({ code: "FORUM_NOT_FOUND" }, { status: 404 });
  return Response.json(result);
}
