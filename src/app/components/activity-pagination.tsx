import Link from "next/link";

import type { ActivityFeedPagination } from "@domain/activity";

export function ActivityPagination({ pagination }: { pagination: ActivityFeedPagination }) {
  if (pagination.pageCount <= 1) return null;

  const pageLink = (page: number): string => `/home?activityPage=${page}#activity-title`;

  return (
    <nav aria-label="Paginación de actividad" className="activity-pagination">
      {pagination.page > 1 ? <Link className="text-link" href={pageLink(pagination.page - 1)}>Actividad anterior</Link> : <span aria-disabled="true">Actividad anterior</span>}
      <span aria-current="page">{pagination.start}-{pagination.end} de {pagination.total}</span>
      {pagination.page < pagination.pageCount ? <Link className="text-link" href={pageLink(pagination.page + 1)}>Actividad siguiente</Link> : <span aria-disabled="true">Actividad siguiente</span>}
    </nav>
  );
}
