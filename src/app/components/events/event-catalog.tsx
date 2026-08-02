"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { EventSort, EventView, PublicEvent } from "@domain/events";

import {
  buildEventsCatalogHref,
  eventLocationLabel,
  formatEventDateTime,
  ownerInitials,
} from "@/app/components/events/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function EventCardMenu({ eventId, isOwn, title }: { eventId: string; isOwn: boolean; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="events-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="events-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="events-card-menu-panel" role="menu">
          <Link href={`/events/${encodeURIComponent(eventId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver evento
          </Link>
          {isOwn ? (
            <Link href={`/events/${encodeURIComponent(eventId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EventCard({ event, layout = "grid" }: { event: PublicEvent; layout?: "grid" | "list" }) {
  const href = `/events/${encodeURIComponent(event.id)}`;
  return (
    <article className={layout === "list" ? "events-card events-card-list" : "events-card"}>
      <Link aria-label={`Ver evento ${event.title}`} className="events-card-link" href={href}>
        <div aria-hidden="true" className="events-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M8 6h16a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 4v2h12v-2H10zm0 6v2h8v-2h-8z"
              fill="currentColor"
            />
          </svg>
          {event.inviteOnly ? <span className="events-badge events-badge-invite">Solo invitados</span> : null}
        </div>
        <div className="events-card-body">
          <p className="events-card-category">{event.category?.title ?? "Evento"}</p>
          <h2>{event.title}</h2>
          {event.description ? <p className="events-card-desc">{event.description}</p> : null}
          <div className="events-card-owner">
            <span className="events-avatar">{ownerInitials(event.owner.displayName)}</span>
            <span>{event.owner.displayName}</span>
          </div>
          <dl className="events-card-meta">
            <div>
              <dt>Inicio</dt>
              <dd>
                {event.startsAt ? (
                  <time dateTime={event.startsAt.toISOString()}>{formatEventDateTime(event.startsAt)}</time>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Lugar</dt>
              <dd>{eventLocationLabel(event.location, event.host)}</dd>
            </div>
            <div>
              <dt>Visitas</dt>
              <dd>{event.views}</dd>
            </div>
          </dl>
        </div>
      </Link>
      {event.isOwn ? <span className="events-badge events-badge-own">Tu evento</span> : null}
      <EventCardMenu eventId={event.id} isOwn={event.isOwn} title={event.title} />
    </article>
  );
}

export function EventGrid({ events, layout = "grid" }: { events: PublicEvent[]; layout?: "grid" | "list" }) {
  return (
    <div className={layout === "list" ? "events-grid events-grid-list" : "events-grid"}>
      {events.map((event) => (
        <EventCard event={event} key={event.id} layout={layout} />
      ))}
    </div>
  );
}

export function EventCategoryBar({
  categories,
  activeCategoryId,
  sort,
  view,
  layout,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  sort: EventSort;
  view: EventView;
  layout: "grid" | "list";
}) {
  return (
    <div aria-label="Filtrar por categoría" className="events-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "events-chip events-chip-active" : "events-chip"}
        href={buildEventsCatalogHref({ categoryId: null, sort, view, layout })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={activeCategoryId === category.id ? "events-chip events-chip-active" : "events-chip"}
            href={buildEventsCatalogHref({ categoryId: category.id, sort, view, layout })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function EventToolbar({
  categoryId,
  sort,
  view,
  layout,
  total,
  canCreate,
}: {
  categoryId: string | null;
  sort: EventSort;
  view: EventView;
  layout: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="events-toolbar">
      <div className="events-toolbar-filters">
        <label className="events-toolbar-filter" htmlFor="events-view">
          <span>Mostrar</span>
          <select
            id="events-view"
            onChange={(event) => {
              router.push(
                buildEventsCatalogHref({
                  view: event.target.value as EventView,
                  sort,
                  categoryId,
                  layout,
                  page: 1,
                }),
              );
            }}
            value={view}
          >
            <option value="all">Todos los eventos</option>
            <option value="upcoming">Próximos eventos</option>
          </select>
        </label>
        <label className="events-toolbar-filter" htmlFor="events-sort">
          <span>Ordenar</span>
          <select
            id="events-sort"
            onChange={(event) => {
              router.push(
                buildEventsCatalogHref({
                  sort: event.target.value as EventSort,
                  view,
                  categoryId,
                  layout,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="startsAt">Por inicio</option>
            <option value="endsAt">Por finalización</option>
          </select>
        </label>
      </div>
      <div className="events-toolbar-controls">
        <p className="events-toolbar-count">{total === 1 ? "1 evento" : `${total} eventos`}</p>
        <div aria-label="Modo de vista" className="events-view-toggle" role="group">
          <Link
            aria-current={layout === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={layout === "grid" ? "events-view-btn is-active" : "events-view-btn"}
            href={buildEventsCatalogHref({ categoryId, sort, view, layout: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={layout === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={layout === "list" ? "events-view-btn is-active" : "events-view-btn"}
            href={buildEventsCatalogHref({ categoryId, sort, view, layout: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="events-toolbar-note">Inicia sesión para crear un evento.</p> : null}
    </div>
  );
}

export function EventPagination({
  page,
  pageCount,
  categoryId,
  sort,
  view,
  layout,
}: {
  page: number;
  pageCount: number;
  categoryId: string | null;
  sort: EventSort;
  view: EventView;
  layout: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildEventsCatalogHref({ page: p, categoryId, sort, view, layout });
  return (
    <nav aria-label="Paginación de eventos" className="events-pagination">
      {page > 1 ? (
        <Link className="events-btn events-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="events-btn events-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="events-btn events-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="events-btn events-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
