import Link from "next/link";

function withQuery(basePath: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function MemberListPagination({
  page,
  pageCount,
  basePath,
  ariaLabel,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  ariaLabel: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={ariaLabel} className="member-list-pagination">
      {page > 1 ? (
        <Link className="text-link" href={withQuery(basePath, { membersPage: String(page - 1) })}>
          Anteriores
        </Link>
      ) : (
        <span>Anterior</span>
      )}
      <span>
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="text-link" href={withQuery(basePath, { membersPage: String(page + 1) })}>
          Siguientes
        </Link>
      ) : (
        <span>Siguiente</span>
      )}
    </nav>
  );
}

export function AttendeeListPagination({
  page,
  pageCount,
  basePath,
  filter,
  ariaLabel,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  filter: string;
  ariaLabel: string;
}) {
  if (pageCount <= 1) return null;

  const params = (nextPage: number) =>
    withQuery(basePath, {
      attendeesPage: nextPage > 1 ? String(nextPage) : undefined,
      attendeesFilter: filter !== "all" ? filter : undefined,
    });

  return (
    <nav aria-label={ariaLabel} className="member-list-pagination">
      {page > 1 ? (
        <Link className="text-link" href={params(page - 1)}>
          Anteriores
        </Link>
      ) : (
        <span>Anterior</span>
      )}
      <span>
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="text-link" href={params(page + 1)}>
          Siguientes
        </Link>
      ) : (
        <span>Siguiente</span>
      )}
    </nav>
  );
}
