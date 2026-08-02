import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function EventBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="events-breadcrumb">
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

export function EventEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="events-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="events-empty-action">{action}</div> : null}
    </div>
  );
}

export function EventCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando eventos" className="events-skeleton-catalog">
      <div className="events-skeleton-line events-skeleton-line-lg" />
      <div className="events-skeleton-toolbar">
        <div className="events-skeleton-pill events-skeleton-pill-wide" />
        <div className="events-skeleton-pill" />
      </div>
      <div className="events-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="events-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando evento" className="events-skeleton-detail">
      <div className="events-skeleton-line events-skeleton-line-lg" />
      <div className="events-skeleton-line events-skeleton-line-md" />
      <div className="events-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="events-skeleton-pill events-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
