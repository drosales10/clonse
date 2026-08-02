import type { Metadata } from "next";
import Link from "next/link";

import {
  EventCategoryBar,
  EventGrid,
  EventPagination,
  EventToolbar,
} from "@/app/components/events/event-catalog";
import { EventEmptyState } from "@/app/components/events/event-ui";
import { normalizeEventQuery, type EventSort, type EventView } from "@domain/events";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getEventCatalog } from "@/server/events/service";

export const metadata: Metadata = {
  title: "Eventos | nexo.",
  description: "Descubre eventos visibles de la comunidad.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const layout = readString(params.layout) === "list" ? "list" : "grid";
  const query = normalizeEventQuery({
    page: readNumber(params.page),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
    view: readView(params.view),
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getEventCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="events-module">
        <section className="events-page" aria-labelledby="events-title" id="events-catalog">
          <header className="events-page-header">
            <nav aria-label="Ruta de navegación" className="events-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Eventos</span>
                </li>
              </ol>
            </nav>
            <div className="events-page-heading">
              <div>
                <h1 id="events-title">Eventos</h1>
                <p className="events-page-lead">
                  Explora actividades de la comunidad, confirma tu asistencia y publica tus propios eventos.
                </p>
              </div>
              {canCreate ? (
                <Link className="events-btn events-btn-primary" href="/events/new">
                  Crear evento
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="events-permission-notice" role="note">
              <p>Inicia sesión para crear eventos y confirmar asistencia.</p>
              <Link className="events-text-link" href="/login?returnUrl=/events/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <EventCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            layout={layout}
            sort={query.sort}
            view={query.view}
          />
          <EventToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            layout={layout}
            sort={query.sort}
            total={catalog.pagination.total}
            view={query.view}
          />
          {catalog.items.length > 0 ? (
            <EventGrid events={catalog.items} layout={layout} />
          ) : (
            <EventEmptyState
              action={
                canCreate ? (
                  <Link className="events-btn events-btn-primary" href="/events/new">
                    Crear tu primer evento
                  </Link>
                ) : undefined
              }
              description="Cuando haya eventos publicados, los verás aquí."
              title="No encontramos eventos con estos filtros"
            />
          )}
          <EventPagination
            categoryId={query.categoryId}
            layout={layout}
            page={catalog.pagination.page}
            pageCount={catalog.pagination.pageCount}
            sort={query.sort}
            view={query.view}
          />
        </section>
      </div>
    </ClientShell>
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
function readSort(value: string | string[] | undefined): EventSort | undefined {
  const raw = readString(value);
  return raw === "created" || raw === "startsAt" || raw === "endsAt" ? raw : undefined;
}
function readView(value: string | string[] | undefined): EventView | undefined {
  const raw = readString(value);
  return raw === "all" || raw === "upcoming" ? raw : undefined;
}
