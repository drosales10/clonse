import Link from "next/link";

import type { PublicBlogEntryDetail } from "@domain/blogs";

import { BlogBreadcrumb } from "@/app/components/blogs/blog-ui";
import { formatBlogDateTime, ownerInitials } from "@/app/components/blogs/utils";

export function BlogHeader({ entry }: { entry: PublicBlogEntryDetail }) {
  return (
    <header className="blogs-detail-header">
      <BlogBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Blogs", href: "/blogs" },
          { label: entry.title },
        ]}
      />
      <div className="blogs-detail-heading">
        <div>
          <span className="blogs-category-badge">{entry.category?.title ?? "Blog"}</span>
          <h1 id="blog-entry-title">{entry.title}</h1>
          {!entry.catalogVisible && entry.isOwner ? (
            <p className="blogs-inline-notice" role="status">
              Esta entrada está oculta del catálogo público.
            </p>
          ) : null}
        </div>
        <div className="blogs-detail-actions">
          <Link className="blogs-btn blogs-btn-secondary" href="/blogs">
            Volver a Blogs
          </Link>
          {entry.isOwner ? (
            <Link className="blogs-btn blogs-btn-primary" href={`/blogs/${encodeURIComponent(entry.id)}/edit`}>
              Editar entrada
            </Link>
          ) : null}
        </div>
      </div>
      <div className="blogs-detail-author">
        <span aria-hidden="true" className="blogs-avatar blogs-avatar-lg">
          {ownerInitials(entry.author.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(entry.author.username)}`}>{entry.author.displayName}</Link>
          <p>@{entry.author.username}</p>
        </div>
      </div>
      <dl className="blogs-detail-facts">
        <div>
          <dt>Publicado</dt>
          <dd>
            <time dateTime={entry.createdAt.toISOString()}>{formatBlogDateTime(entry.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{entry.views}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{entry.category?.title ?? "—"}</dd>
        </div>
      </dl>
    </header>
  );
}
