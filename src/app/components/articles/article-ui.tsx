import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function ArticleBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="articles-breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ArticleEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="articles-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="articles-empty-action">{action}</div> : null}
    </div>
  );
}

export function ArticleCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando artículos" className="articles-skeleton-catalog">
      <div className="articles-skeleton-line articles-skeleton-line-lg" />
      <div className="articles-skeleton-toolbar">
        <div className="articles-skeleton-pill articles-skeleton-pill-wide" />
        <div className="articles-skeleton-pill" />
      </div>
      <div className="articles-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="articles-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando artículo" className="articles-skeleton-detail">
      <div className="articles-skeleton-line articles-skeleton-line-lg" />
      <div className="articles-skeleton-line articles-skeleton-line-md" />
      <div className="articles-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="articles-skeleton-pill articles-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
