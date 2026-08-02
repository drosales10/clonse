import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function PollBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="polls-breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <span aria-current={isLast ? "page" : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PollEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="polls-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="polls-empty-action">{action}</div> : null}
    </div>
  );
}

export function PollCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando encuestas" className="polls-skeleton-catalog">
      <div className="polls-skeleton-line polls-skeleton-line-lg" />
      <div className="polls-skeleton-toolbar">
        <div className="polls-skeleton-pill polls-skeleton-pill-wide" />
        <div className="polls-skeleton-pill" />
      </div>
      <div className="polls-skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="polls-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function PollDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando encuesta" className="polls-skeleton-detail">
      <div className="polls-skeleton-line polls-skeleton-line-lg" />
      <div className="polls-skeleton-line polls-skeleton-line-md" />
      <div className="polls-skeleton-results">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="polls-skeleton-pill polls-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
