"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PollSort, PublicPoll } from "@domain/polls";

import { buildPollsCatalogHref, formatPollDate, ownerInitials } from "@/app/components/polls/utils";

function PollCardMenu({ pollId, isOwn, title }: { pollId: string; isOwn: boolean; title: string }) {
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
    <div className="polls-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="polls-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="polls-card-menu-panel" role="menu">
          <Link href={`/polls/${encodeURIComponent(pollId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver encuesta
          </Link>
          {isOwn ? (
            <Link href={`/polls/${encodeURIComponent(pollId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PollCard({
  poll,
  sort,
  view = "grid",
}: {
  poll: PublicPoll;
  sort: PollSort;
  view?: "grid" | "list";
}) {
  const href = `/polls/${encodeURIComponent(poll.id)}`;
  return (
    <article className={view === "list" ? "polls-card polls-card-list" : "polls-card"}>
      <Link aria-label={`Ver encuesta ${poll.title}`} className="polls-card-link" href={href}>
        <div aria-hidden="true" className="polls-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path d="M6 8h20v3H6V8zm0 6h14v3H6v-3zm0 6h18v3H6v-3z" fill="currentColor" />
          </svg>
          <span className={poll.closed ? "polls-status polls-status-closed" : "polls-status polls-status-open"}>
            {poll.closed ? "Cerrada" : "Abierta"}
          </span>
        </div>
        <div className="polls-card-body">
          <h2>{poll.title}</h2>
          {poll.description ? <p className="polls-card-desc">{poll.description}</p> : null}
          <div className="polls-card-owner">
            <span className="polls-avatar">{ownerInitials(poll.owner.displayName)}</span>
            <span>{poll.owner.displayName}</span>
          </div>
          <dl className="polls-card-meta">
            <div>
              <dt>{sort === "views" ? "Visitas" : "Votos"}</dt>
              <dd>{sort === "views" ? poll.views : poll.totalVotes}</dd>
            </div>
            <div>
              <dt>Opciones</dt>
              <dd>{poll.optionCount}</dd>
            </div>
            <div>
              <dt>Creada</dt>
              <dd>
                <time dateTime={poll.createdAt.toISOString()}>{formatPollDate(poll.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {poll.isOwn ? <span className="polls-badge polls-badge-own">Tu encuesta</span> : null}
      <PollCardMenu isOwn={poll.isOwn} pollId={poll.id} title={poll.title} />
    </article>
  );
}

export function PollGrid({
  polls,
  sort,
  view = "grid",
}: {
  polls: PublicPoll[];
  sort: PollSort;
  view?: "grid" | "list";
}) {
  return (
    <div className={view === "list" ? "polls-grid polls-grid-list" : "polls-grid"}>
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} sort={sort} view={view} />
      ))}
    </div>
  );
}

export function PollToolbar({
  sort,
  view,
  total,
  canCreate,
}: {
  sort: PollSort;
  view: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="polls-toolbar">
      <div className="polls-toolbar-search">
        <label className="sr-only" htmlFor="polls-search">
          Buscar encuestas
        </label>
        <input disabled id="polls-search" placeholder="Buscar encuestas (próximamente)" type="search" />
      </div>
      <div className="polls-toolbar-controls">
        <label className="polls-toolbar-sort" htmlFor="polls-sort">
          <span>Ordenar por</span>
          <select
            id="polls-sort"
            onChange={(event) => {
              router.push(
                buildPollsCatalogHref({
                  sort: event.target.value as PollSort,
                  view,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="votes">Más votadas</option>
            <option value="views">Más vistas</option>
          </select>
        </label>
        <p className="polls-toolbar-count">{total === 1 ? "1 encuesta" : `${total} encuestas`}</p>
        <div aria-label="Modo de vista" className="polls-view-toggle" role="group">
          <Link
            aria-current={view === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={view === "grid" ? "polls-view-btn is-active" : "polls-view-btn"}
            href={buildPollsCatalogHref({ sort, view: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={view === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={view === "list" ? "polls-view-btn is-active" : "polls-view-btn"}
            href={buildPollsCatalogHref({ sort, view: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="polls-toolbar-note">Inicia sesión para crear una encuesta.</p> : null}
    </div>
  );
}

export function PollPagination({
  page,
  pageCount,
  sort,
  view,
}: {
  page: number;
  pageCount: number;
  sort: PollSort;
  view: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildPollsCatalogHref({ page: p, sort, view });
  return (
    <nav aria-label="Paginación de encuestas" className="polls-pagination">
      {page > 1 ? (
        <Link className="polls-btn polls-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="polls-btn polls-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="polls-btn polls-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="polls-btn polls-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
