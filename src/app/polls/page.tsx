import type { Metadata } from "next";
import Link from "next/link";

import { normalizePollQuery, type PollSort } from "@domain/polls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPollCatalog } from "@/server/polls/service";

export const metadata: Metadata = {
  title: "Encuestas | nexo.",
  description: "Explora encuestas visibles de la comunidad.",
};

export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: PollSort =
    sortRaw === "votes" || sortRaw === "views" ? sortRaw : "created";
  const query = normalizePollQuery({
    page: readNumber(params.page),
    sort,
  });
  const viewer = await getCurrentUser();
  const catalog = await getPollCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel poll-panel" aria-labelledby="polls-title">
        <p className="eyebrow">Comunidad · Encuestas</p>
        <h1 id="polls-title">Encuestas</h1>
        <p className="lead">
          Participa en encuestas publicadas. El voto requiere sesión y solo se acepta una opción por
          persona.
        </p>

        <div className="poll-toolbar">
          {viewer ? (
            <Link className="button button-primary button-small" href="/polls/new">
              Crear encuesta
            </Link>
          ) : (
            <Link className="text-link" href="/login?returnUrl=/polls/new">
              Inicia sesión para crear una encuesta
            </Link>
          )}
        </div>

        <div className="poll-sort-bar" aria-label="Ordenar encuestas">
          {(
            [
              { key: "created", label: "Más recientes" },
              { key: "votes", label: "Más votadas" },
              { key: "views", label: "Más vistas" },
            ] as const
          ).map((item) => (
            <Link
              className={query.sort === item.key ? "category-chip category-chip-active" : "category-chip"}
              href={item.key === "created" ? "/polls#polls-title" : `/polls?sort=${item.key}#polls-title`}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="poll-list">
            {catalog.items.map((poll) => (
              <article className="poll-card" key={poll.id}>
                <div className="poll-card-heading">
                  <div>
                    <p className="eyebrow">{poll.closed ? "Cerrada" : "Abierta"}</p>
                    <h2>
                      <Link className="poll-card-link" href={`/polls/${encodeURIComponent(poll.id)}`}>
                        {poll.title}
                      </Link>
                    </h2>
                  </div>
                  {poll.closed ? <span className="poll-badge">Cerrada</span> : null}
                </div>
                {poll.description ? <p className="poll-summary">{poll.description}</p> : null}
                <dl className="poll-facts">
                  <div>
                    <dt>Autor</dt>
                    <dd>
                      <Link href={`/profile/${encodeURIComponent(poll.owner.username)}`}>
                        {poll.owner.displayName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Votos</dt>
                    <dd>{poll.totalVotes}</dd>
                  </div>
                  <div>
                    <dt>Opciones</dt>
                    <dd>{poll.optionCount}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Todavía no hay encuestas autorizadas en el catálogo público.</p>
        )}

        <PollPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} sort={query.sort} />
      </section>
    </ClientShell>
  );
}

function PollPagination({
  page,
  pageCount,
  sort,
}: {
  page: number;
  pageCount: number;
  sort: PollSort;
}) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (sort !== "created") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/polls${query ? `?${query}` : ""}#polls-title`;
  };
  return (
    <nav aria-label="Paginación de encuestas" className="poll-pagination">
      {page > 1 ? (
        <Link className="text-link" href={href(page - 1)}>
          Anteriores
        </Link>
      ) : (
        <span aria-disabled="true">Anteriores</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="text-link" href={href(page + 1)}>
          Siguientes
        </Link>
      ) : (
        <span aria-disabled="true">Siguientes</span>
      )}
    </nav>
  );
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function readNumber(value: string | string[] | undefined): number | undefined {
  const raw = readString(value);
  const number = Number(raw);
  return Number.isInteger(number) ? number : undefined;
}
