import type { Metadata } from "next";
import Link from "next/link";

import { normalizeEventQuery, type EventSort, type EventView } from "@domain/events";
import { getCurrentUser } from "@/server/auth/session";
import { getEventCatalog } from "@/server/events/service";

export const metadata: Metadata = {
  title: "Eventos | Red Social",
  description: "Descubre eventos visibles de la comunidad.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeEventQuery({
    page: readNumber(params.page),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
    view: readView(params.view),
  });
  const viewer = await getCurrentUser();
  const catalog = await getEventCatalog(viewer?.id ?? null, query);

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación principal">
          {viewer ? <Link className="text-link" href="/home">Inicio</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}
          {viewer ? <Link className="text-link" href={`/profile/${encodeURIComponent(viewer.username)}`}>Mi perfil</Link> : null}
          <Link className="text-link" href="/businesses">Negocios</Link>
        </nav>
      </header>

      <section className="profile-panel event-panel" aria-labelledby="events-title">
        <p className="eyebrow">Comunidad · Eventos</p>
        <h1 id="events-title">Vive algo nuevo</h1>
        <p className="lead">Explora eventos visibles para ti y consulta los próximos encuentros de la comunidad.</p>

        <form className="event-filters" method="get">
          <div>
            <label htmlFor="event-view">Mostrar</label>
            <select id="event-view" name="view" defaultValue={query.view}>
              <option value="all">Todos los eventos</option>
              <option value="upcoming">Próximos eventos</option>
            </select>
          </div>
          <div>
            <label htmlFor="event-sort">Ordenar</label>
            <select id="event-sort" name="sort" defaultValue={query.sort}>
              <option value="created">Más recientes</option>
              <option value="startsAt">Por inicio</option>
              <option value="endsAt">Por finalización</option>
            </select>
          </div>
          {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
          <button className="button button-primary button-small" type="submit">Filtrar</button>
        </form>

        <div className="event-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.view, query.sort, null)}>Todos</Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.view, query.sort, category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="event-list">
            {catalog.items.map((event) => (
              <article className="event-card" key={event.id}>
                <div className="event-card-heading">
                  <div>
                    <p className="eyebrow">{event.category?.title ?? "Evento"}</p>
                    <h2><Link className="event-card-link" href={`/events/${encodeURIComponent(event.id)}`}>{event.title}</Link></h2>
                  </div>
                  {event.inviteOnly ? <span className="event-badge">Solo invitados</span> : null}
                </div>
                {event.description ? <p className="event-summary">{event.description}</p> : null}
                <dl className="event-facts">
                  <div><dt>Organiza</dt><dd><Link href={`/profile/${encodeURIComponent(event.owner.username)}`}>{event.owner.displayName}</Link></dd></div>
                  {event.startsAt ? <div><dt>Inicio</dt><dd><time dateTime={event.startsAt.toISOString()}>{formatDate(event.startsAt)}</time></dd></div> : null}
                  {event.endsAt ? <div><dt>Fin</dt><dd><time dateTime={event.endsAt.toISOString()}>{formatDate(event.endsAt)}</time></dd></div> : null}
                  {event.location || event.host ? <div><dt>Lugar</dt><dd>{[event.location, event.host].filter(Boolean).join(" · ")}</dd></div> : null}
                  <div><dt>Actividad</dt><dd>{event.views} visitas</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos eventos visibles con estos filtros.</p>
        )}

        <EventPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} view={query.view} sort={query.sort} categoryId={query.categoryId} />
      </section>
    </main>
  );
}

function EventPagination({ page, pageCount, view, sort, categoryId }: { page: number; pageCount: number; view: EventView; sort: EventSort; categoryId: string | null }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (view !== "all") params.set("view", view);
    if (sort !== "created") params.set("sort", sort);
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/events?${params.toString()}#events-title`;
  };
  return <nav className="event-pagination" aria-label="Paginación de eventos">
    {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
    <span aria-current="page">Página {page} de {pageCount}</span>
    {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
  </nav>;
}

function categoryHref(view: EventView, sort: EventSort, categoryId: string | null): string {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (sort !== "created") params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);
  const query = params.toString();
  return `/events${query ? `?${query}` : ""}#events-title`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function readNumber(value: string | string[] | undefined): number | undefined { const raw = readString(value); const number = Number(raw); return Number.isInteger(number) ? number : undefined; }
function readSort(value: string | string[] | undefined): EventSort | undefined { const raw = readString(value); return raw === "created" || raw === "startsAt" || raw === "endsAt" ? raw : undefined; }
function readView(value: string | string[] | undefined): EventView | undefined { const raw = readString(value); return raw === "all" || raw === "upcoming" ? raw : undefined; }
