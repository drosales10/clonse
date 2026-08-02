import Link from "next/link";

import type { PublicArticleDetail } from "@domain/articles";

import { ArticleBreadcrumb } from "@/app/components/articles/article-ui";
import { formatArticleDateTime, ownerInitials } from "@/app/components/articles/utils";

export function ArticleHeader({ article }: { article: PublicArticleDetail }) {
  return (
    <header className="articles-detail-header">
      <ArticleBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Artículos", href: "/articles" },
          { label: article.title },
        ]}
      />
      <div className="articles-detail-heading">
        <div>
          <div className="articles-detail-badges">
            <span className="articles-category-badge">{article.category?.title ?? "Artículo"}</span>
            {article.featured ? <span className="articles-badge articles-badge-featured">Destacado</span> : null}
          </div>
          <h1 id="article-title">{article.title}</h1>
          {!article.catalogVisible && article.isOwner ? (
            <p className="articles-inline-notice" role="status">
              Este artículo está oculto del catálogo público.
            </p>
          ) : null}
        </div>
        <div className="articles-detail-actions">
          <Link className="articles-btn articles-btn-secondary" href="/articles">
            Volver a Artículos
          </Link>
          {article.isOwner ? (
            <Link className="articles-btn articles-btn-primary" href={`/articles/${encodeURIComponent(article.id)}/edit`}>
              Editar artículo
            </Link>
          ) : null}
        </div>
      </div>
      <div className="articles-detail-author">
        <span aria-hidden="true" className="articles-avatar articles-avatar-lg">
          {ownerInitials(article.author.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(article.author.username)}`}>{article.author.displayName}</Link>
          <p>@{article.author.username}</p>
        </div>
      </div>
      <dl className="articles-detail-facts">
        <div>
          <dt>Publicado</dt>
          <dd>
            <time dateTime={article.publishedAt.toISOString()}>{formatArticleDateTime(article.publishedAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{article.views}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{article.category?.title ?? "—"}</dd>
        </div>
      </dl>
    </header>
  );
}
