import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleHeader } from "@/app/components/articles/article-header";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleDetail } from "@/server/articles/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ articleId: string }>;
}): Promise<Metadata> {
  const { articleId } = await params;
  const viewer = await getCurrentUser();
  const article = await getArticleDetail(viewer?.id ?? null, articleId);
  return { title: article ? `${article.title} | Artículos` : "Artículo | nexo." };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const viewer = await getCurrentUser();
  const article = await getArticleDetail(viewer?.id ?? null, articleId);
  if (!article) notFound();

  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <article className="articles-page articles-detail-page" aria-labelledby="article-title">
          <ArticleHeader article={article} />
          <section aria-labelledby="article-body-title" className="articles-detail-body-section">
            <h2 className="sr-only" id="article-body-title">
              Contenido
            </h2>
            <div className="articles-detail-body">
              {article.body ? (
                <p>{article.body}</p>
              ) : (
                <p className="articles-detail-body-empty">Este artículo no tiene contenido visible.</p>
              )}
            </div>
          </section>
          <p className="articles-detail-note">
            El contenido se muestra como texto seguro; los comentarios, medios y etiquetas legacy no forman parte de
            esta lectura.
          </p>
        </article>
      </div>
    </ClientShell>
  );
}
