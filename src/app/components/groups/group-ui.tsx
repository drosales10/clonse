import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function GroupBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="groups-breadcrumb">
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

export function GroupEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="groups-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="groups-empty-action">{action}</div> : null}
    </div>
  );
}

export function GroupCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando grupos" className="groups-skeleton-catalog">
      <div className="groups-skeleton-line groups-skeleton-line-lg" />
      <div className="groups-skeleton-toolbar">
        <div className="groups-skeleton-pill groups-skeleton-pill-wide" />
        <div className="groups-skeleton-pill" />
      </div>
      <div className="groups-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="groups-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function GroupDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando grupo" className="groups-skeleton-detail">
      <div className="groups-skeleton-line groups-skeleton-line-lg" />
      <div className="groups-skeleton-line groups-skeleton-line-md" />
      <div className="groups-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="groups-skeleton-pill groups-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
