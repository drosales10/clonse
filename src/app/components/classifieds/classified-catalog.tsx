"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ClassifiedSort, PublicClassified } from "@domain/classifieds";

import {
  buildClassifiedsCatalogHref,
  formatClassifiedDate,
  ownerInitials,
  truncateText,
} from "@/app/components/classifieds/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function ClassifiedCardMenu({
  classifiedId,
  isOwn,
  title,
}: {
  classifiedId: string;
  isOwn: boolean;
  title: string;
}) {
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
    <div className="classifieds-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="classifieds-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="classifieds-card-menu-panel" role="menu">
          <Link
            href={`/classifieds/${encodeURIComponent(classifiedId)}`}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Ver clasificado
          </Link>
          {isOwn ? (
            <Link
              href={`/classifieds/${encodeURIComponent(classifiedId)}/edit`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ClassifiedCard({
  classified,
  sort,
  layout = "grid",
}: {
  classified: PublicClassified;
  sort: ClassifiedSort;
  layout?: "grid" | "list";
}) {
  const href = `/classifieds/${encodeURIComponent(classified.id)}`;
  const summary = truncateText(classified.body);

  return (
    <article className={layout === "list" ? "classifieds-card classifieds-card-list" : "classifieds-card"}>
      <Link aria-label={`Ver clasificado ${classified.title}`} className="classifieds-card-link" href={href}>
        <div aria-hidden="true" className="classifieds-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M8 6h16a2 2 0 0 1 2 2v18l-6-4H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
              fill="currentColor"
            />
          </svg>
          <span className="classifieds-category-badge">{classified.category?.title ?? "Clasificado"}</span>
        </div>
        <div className="classifieds-card-body">
          <h2>{classified.title}</h2>
          {summary ? <p className="classifieds-card-desc">{summary}</p> : null}
          <div className="classifieds-card-owner">
            <span className="classifieds-avatar">{ownerInitials(classified.owner.displayName)}</span>
            <span>{classified.owner.displayName}</span>
          </div>
          <dl className="classifieds-card-meta">
            <div>
              <dt>Visitas</dt>
              <dd>{classified.views}</dd>
            </div>
            <div>
              <dt>Comentarios</dt>
              <dd>{classified.totalComments}</dd>
            </div>
            <div>
              <dt>{sort === "updated" ? "Actualizado" : "Creado"}</dt>
              <dd>
                <time
                  dateTime={
                    sort === "updated"
                      ? classified.updatedAt.toISOString()
                      : classified.createdAt.toISOString()
                  }
                >
                  {formatClassifiedDate(sort === "updated" ? classified.updatedAt : classified.createdAt)}
                </time>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {classified.isOwn ? <span className="classifieds-badge classifieds-badge-own">Tu clasificado</span> : null}
      <ClassifiedCardMenu classifiedId={classified.id} isOwn={classified.isOwn} title={classified.title} />
    </article>
  );
}

export function ClassifiedGrid({
  classifieds,
  sort,
  layout = "grid",
}: {
  classifieds: PublicClassified[];
  sort: ClassifiedSort;
  layout?: "grid" | "list";
}) {
  return (
    <div className={layout === "list" ? "classifieds-grid classifieds-grid-list" : "classifieds-grid"}>
      {classifieds.map((classified) => (
        <ClassifiedCard classified={classified} key={classified.id} layout={layout} sort={sort} />
      ))}
    </div>
  );
}

export function ClassifiedCategoryBar({
  categories,
  activeCategoryId,
  search,
  sort,
  layout,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  search: string;
  sort: ClassifiedSort;
  layout: "grid" | "list";
}) {
  return (
    <div aria-label="Filtrar por categoría" className="classifieds-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "classifieds-chip classifieds-chip-active" : "classifieds-chip"}
        href={buildClassifiedsCatalogHref({ categoryId: null, search, sort, layout })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={
              activeCategoryId === category.id ? "classifieds-chip classifieds-chip-active" : "classifieds-chip"
            }
            href={buildClassifiedsCatalogHref({ categoryId: category.id, search, sort, layout })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function ClassifiedToolbar({
  search,
  sort,
  layout,
  categoryId,
  total,
  canCreate,
}: {
  search: string;
  sort: ClassifiedSort;
  layout: "grid" | "list";
  categoryId: string | null;
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="classifieds-toolbar">
      <form action="/classifieds#classifieds-catalog" className="classifieds-toolbar-search" method="get">
        <label className="sr-only" htmlFor="classifieds-search">
          Buscar clasificados
        </label>
        <input
          defaultValue={search}
          id="classifieds-search"
          maxLength={100}
          name="search"
          placeholder="Buscar por título o descripción"
          type="search"
        />
        {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
        {sort !== "created" ? <input name="sort" type="hidden" value={sort} /> : null}
        {layout === "list" ? <input name="layout" type="hidden" value="list" /> : null}
        <button className="classifieds-btn classifieds-btn-secondary" type="submit">
          Buscar
        </button>
      </form>
      <div className="classifieds-toolbar-controls">
        <label className="classifieds-toolbar-sort" htmlFor="classifieds-sort">
          <span>Ordenar por</span>
          <select
            id="classifieds-sort"
            onChange={(event) => {
              router.push(
                buildClassifiedsCatalogHref({
                  search,
                  sort: event.target.value as ClassifiedSort,
                  categoryId,
                  layout,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="updated">Actualizados</option>
            <option value="views">Más vistos</option>
            <option value="comments">Más comentados</option>
          </select>
        </label>
        <p className="classifieds-toolbar-count">
          {total === 1 ? "1 clasificado" : `${total} clasificados`}
        </p>
        <div aria-label="Modo de vista" className="classifieds-view-toggle" role="group">
          <Link
            aria-current={layout === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={layout === "grid" ? "classifieds-view-btn is-active" : "classifieds-view-btn"}
            href={buildClassifiedsCatalogHref({ search, sort, categoryId, layout: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={layout === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={layout === "list" ? "classifieds-view-btn is-active" : "classifieds-view-btn"}
            href={buildClassifiedsCatalogHref({ search, sort, categoryId, layout: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? (
        <p className="classifieds-toolbar-note">Inicia sesión para crear un clasificado.</p>
      ) : null}
    </div>
  );
}

export function ClassifiedPagination({
  page,
  pageCount,
  search,
  sort,
  categoryId,
  layout,
}: {
  page: number;
  pageCount: number;
  search: string;
  sort: ClassifiedSort;
  categoryId: string | null;
  layout: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildClassifiedsCatalogHref({ page: p, search, sort, categoryId, layout });
  return (
    <nav aria-label="Paginación de clasificados" className="classifieds-pagination">
      {page > 1 ? (
        <Link className="classifieds-btn classifieds-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="classifieds-btn classifieds-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="classifieds-btn classifieds-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="classifieds-btn classifieds-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
