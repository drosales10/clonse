"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { PublicGroup } from "@domain/groups";

import { buildGroupsCatalogHref, formatGroupDate, ownerInitials } from "@/app/components/groups/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function GroupCardMenu({ groupId, isOwn, title }: { groupId: string; isOwn: boolean; title: string }) {
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
    <div className="groups-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="groups-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="groups-card-menu-panel" role="menu">
          <Link href={`/groups/${encodeURIComponent(groupId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver grupo
          </Link>
          {isOwn ? (
            <Link href={`/groups/${encodeURIComponent(groupId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function GroupCard({ group, view = "grid" }: { group: PublicGroup; view?: "grid" | "list" }) {
  const href = `/groups/${encodeURIComponent(group.id)}`;
  return (
    <article className={view === "list" ? "groups-card groups-card-list" : "groups-card"}>
      <Link aria-label={`Ver grupo ${group.title}`} className="groups-card-link" href={href}>
        <div aria-hidden="true" className="groups-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M8 12a8 8 0 1 1 16 0v2h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1v-2zm4 0v2h8v-2a4 4 0 0 0-8 0z"
              fill="currentColor"
            />
          </svg>
          <span className="groups-category-badge">{group.category?.title ?? "Grupo"}</span>
        </div>
        <div className="groups-card-body">
          <h2>{group.title}</h2>
          {group.description ? <p className="groups-card-desc">{group.description}</p> : null}
          <div className="groups-card-owner">
            <span className="groups-avatar">{ownerInitials(group.owner.displayName)}</span>
            <span>{group.owner.displayName}</span>
          </div>
          <dl className="groups-card-meta">
            <div>
              <dt>Visitas</dt>
              <dd>{group.views}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{group.category?.title ?? "—"}</dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>
                <time dateTime={group.createdAt.toISOString()}>{formatGroupDate(group.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {group.isOwn ? <span className="groups-badge groups-badge-own">Tu grupo</span> : null}
      <GroupCardMenu groupId={group.id} isOwn={group.isOwn} title={group.title} />
    </article>
  );
}

export function GroupGrid({ groups, view = "grid" }: { groups: PublicGroup[]; view?: "grid" | "list" }) {
  return (
    <div className={view === "list" ? "groups-grid groups-grid-list" : "groups-grid"}>
      {groups.map((group) => (
        <GroupCard group={group} key={group.id} view={view} />
      ))}
    </div>
  );
}

export function GroupCategoryBar({
  categories,
  activeCategoryId,
  view,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  view: "grid" | "list";
}) {
  return (
    <div aria-label="Filtrar por categoría" className="groups-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "groups-chip groups-chip-active" : "groups-chip"}
        href={buildGroupsCatalogHref({ categoryId: null, view })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={activeCategoryId === category.id ? "groups-chip groups-chip-active" : "groups-chip"}
            href={buildGroupsCatalogHref({ categoryId: category.id, view })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function GroupToolbar({
  categoryId,
  view,
  total,
  canCreate,
}: {
  categoryId: string | null;
  view: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  return (
    <div className="groups-toolbar">
      <div className="groups-toolbar-search">
        <label className="sr-only" htmlFor="groups-search">
          Buscar grupos
        </label>
        <input disabled id="groups-search" placeholder="Buscar grupos (próximamente)" type="search" />
      </div>
      <div className="groups-toolbar-controls">
        <p className="groups-toolbar-count">{total === 1 ? "1 grupo" : `${total} grupos`}</p>
        <div aria-label="Modo de vista" className="groups-view-toggle" role="group">
          <Link
            aria-current={view === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={view === "grid" ? "groups-view-btn is-active" : "groups-view-btn"}
            href={buildGroupsCatalogHref({ categoryId, view: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={view === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={view === "list" ? "groups-view-btn is-active" : "groups-view-btn"}
            href={buildGroupsCatalogHref({ categoryId, view: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="groups-toolbar-note">Inicia sesión para crear un grupo.</p> : null}
    </div>
  );
}

export function GroupPagination({
  page,
  pageCount,
  categoryId,
  view,
}: {
  page: number;
  pageCount: number;
  categoryId: string | null;
  view: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildGroupsCatalogHref({ page: p, categoryId, view });
  return (
    <nav aria-label="Paginación de grupos" className="groups-pagination">
      {page > 1 ? (
        <Link className="groups-btn groups-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="groups-btn groups-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="groups-btn groups-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="groups-btn groups-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
