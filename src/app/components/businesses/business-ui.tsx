import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function BusinessBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="businesses-breadcrumb">
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

export function BusinessEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="businesses-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="businesses-empty-action">{action}</div> : null}
    </div>
  );
}

export function BusinessCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando negocios" className="businesses-skeleton-catalog">
      <div className="businesses-skeleton-line businesses-skeleton-line-lg" />
      <div className="businesses-skeleton-toolbar">
        <div className="businesses-skeleton-pill businesses-skeleton-pill-wide" />
        <div className="businesses-skeleton-pill" />
      </div>
      <div className="businesses-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="businesses-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function BusinessDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando negocio" className="businesses-skeleton-detail">
      <div className="businesses-skeleton-line businesses-skeleton-line-lg" />
      <div className="businesses-skeleton-line businesses-skeleton-line-md" />
      <div className="businesses-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="businesses-skeleton-pill businesses-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
