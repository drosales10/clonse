import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function ClassifiedBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="classifieds-breadcrumb">
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

export function ClassifiedEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="classifieds-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="classifieds-empty-action">{action}</div> : null}
    </div>
  );
}

export function ClassifiedCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando clasificados" className="classifieds-skeleton-catalog">
      <div className="classifieds-skeleton-line classifieds-skeleton-line-lg" />
      <div className="classifieds-skeleton-toolbar">
        <div className="classifieds-skeleton-pill classifieds-skeleton-pill-wide" />
        <div className="classifieds-skeleton-pill" />
      </div>
      <div className="classifieds-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="classifieds-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function ClassifiedDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando clasificado" className="classifieds-skeleton-detail">
      <div className="classifieds-skeleton-line classifieds-skeleton-line-lg" />
      <div className="classifieds-skeleton-line classifieds-skeleton-line-md" />
      <div className="classifieds-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="classifieds-skeleton-pill classifieds-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
