import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function BlogBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="blogs-breadcrumb">
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

export function BlogEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="blogs-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="blogs-empty-action">{action}</div> : null}
    </div>
  );
}

export function BlogCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando blogs" className="blogs-skeleton-catalog">
      <div className="blogs-skeleton-line blogs-skeleton-line-lg" />
      <div className="blogs-skeleton-toolbar">
        <div className="blogs-skeleton-pill blogs-skeleton-pill-wide" />
        <div className="blogs-skeleton-pill" />
      </div>
      <div className="blogs-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="blogs-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function BlogDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando entrada de blog" className="blogs-skeleton-detail">
      <div className="blogs-skeleton-line blogs-skeleton-line-lg" />
      <div className="blogs-skeleton-line blogs-skeleton-line-md" />
      <div className="blogs-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="blogs-skeleton-pill blogs-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
