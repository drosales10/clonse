import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleOwnerControls } from "@/app/components/article-owner-controls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleDetail, listActiveArticleCategories } from "@/server/articles/service";

export const metadata: Metadata = {
  title: "Artículo | Red Social",
  description: "Consulta un artículo publicado de la comunidad.",
};

export default async function ArticleDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const viewer = await getCurrentUser();
  const [article, categories] = await Promise.all([
    getArticleDetail(viewer?.id ?? null, articleId),
    listActiveArticleCategories(),
  ]);
  if (!article) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel article-detail-panel" aria-labelledby="article-title">
        <Link className="text-link article-back-link" href="/articles">
          ← Volver a artículos
        </Link>
        <p className="eyebrow">
          {article.category?.title ?? "Artículo"}
          {article.featured ? " · Destacado" : ""}
        </p>
        <h1 id="article-title">{article.title}</h1>
        {!article.catalogVisible && article.isOwner ? (
          <p className="field-help" role="status">
            Este artículo está oculto del catálogo público.
          </p>
        ) : null}
        <dl className="article-detail-facts">
          <div>
            <dt>Autor</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(article.author.username)}`}>
                {article.author.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Publicado</dt>
            <dd>
              <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Visitas</dt>
            <dd>{article.views}</dd>
          </div>
        </dl>
        <div className="article-detail-body">
          {article.body ? (
            <p>{article.body}</p>
          ) : (
            <p className="empty-state">Este artículo no tiene contenido visible.</p>
          )}
        </div>

        {article.isOwner ? (
          <ArticleOwnerControls
            articleId={article.id}
            body={article.body}
            catalogVisible={article.catalogVisible}
            categories={categories}
            categoryId={article.categoryId}
            title={article.title}
          />
        ) : null}

        <p className="article-detail-note">
          El contenido se muestra como texto seguro; los comentarios, medios y etiquetas legacy no forman parte de
          esta lectura.
        </p>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
