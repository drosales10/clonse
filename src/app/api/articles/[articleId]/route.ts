import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getArticleDetail } from "@/server/articles/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ articleId: string }> }): Promise<Response> {
  const { articleId } = await params;
  const viewer = await getCurrentUser();
  const article = await getArticleDetail(viewer?.id ?? null, articleId);
  return article ? Response.json(article) : Response.json({ code: "ARTICLE_NOT_FOUND" }, { status: 404 });
}
