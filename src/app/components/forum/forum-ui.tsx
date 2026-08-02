import Link from "next/link";
import type { ReactNode } from "react";

export type BreadcrumbItem = { label: string; href?: string };

export function ForumBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="forum-breadcrumb">
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

export function ForumEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="forum-empty" role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="forum-empty-action">{action}</div> : null}
    </div>
  );
}

export function ForumUnavailable({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="forum-unavailable" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="forum-btn forum-btn-primary" href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}

export function ForumCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando foro" className="forum-skeleton-catalog">
      <div className="forum-skeleton-line forum-skeleton-line-lg" />
      <div className="forum-skeleton-toolbar">
        <div className="forum-skeleton-pill forum-skeleton-pill-wide" />
        <div className="forum-skeleton-pill" />
      </div>
      <div className="forum-skeleton-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="forum-skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

export function ForumTopicSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando tema" className="forum-skeleton-detail">
      <div className="forum-skeleton-line forum-skeleton-line-lg" />
      <div className="forum-skeleton-line forum-skeleton-line-md" />
      <div className="forum-skeleton-results">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="forum-skeleton-pill forum-skeleton-pill-wide" key={i} />
        ))}
      </div>
    </div>
  );
}
