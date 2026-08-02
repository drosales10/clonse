"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { BusinessSort, PublicBusiness } from "@domain/businesses";

import {
  buildBusinessesCatalogHref,
  formatBusinessDate,
  locationLabel,
  ownerInitials,
} from "@/app/components/businesses/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function BusinessCardMenu({
  businessId,
  isOwn,
  title,
}: {
  businessId: string;
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
    <div className="businesses-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="businesses-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="businesses-card-menu-panel" role="menu">
          <Link
            href={`/businesses/${encodeURIComponent(businessId)}`}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Ver negocio
          </Link>
          {isOwn ? (
            <Link
              href={`/businesses/${encodeURIComponent(businessId)}/edit`}
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

function sortMetaLabel(sort: BusinessSort): string {
  if (sort === "updated") return "Actualizado";
  if (sort === "rating") return "Valoración";
  if (sort === "views") return "Visitas";
  if (sort === "comments") return "Comentarios";
  return "Creado";
}

function sortMetaValue(business: PublicBusiness, sort: BusinessSort): string {
  if (sort === "updated") return formatBusinessDate(business.updatedAt);
  if (sort === "views") return String(business.views);
  if (sort === "comments") return String(business.totalComments);
  if (sort === "rating") return "—";
  return formatBusinessDate(business.createdAt);
}

export function BusinessCard({
  business,
  sort,
  layout = "grid",
}: {
  business: PublicBusiness;
  sort: BusinessSort;
  layout?: "grid" | "list";
}) {
  const href = `/businesses/${encodeURIComponent(business.id)}`;
  const place = locationLabel(business.city, business.province, business.country);

  return (
    <article className={layout === "list" ? "businesses-card businesses-card-list" : "businesses-card"}>
      <Link aria-label={`Ver negocio ${business.title}`} className="businesses-card-link" href={href}>
        <div aria-hidden="true" className="businesses-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M6 26V12l10-6 10 6v14H6zm4-2h12v-4H10v4zm0-6h5v-4h-5v4zm7 0h5v-4h-5v4z"
              fill="currentColor"
            />
          </svg>
          <span className="businesses-category-badge">{business.category?.title ?? "Negocio"}</span>
          {business.sponsored ? (
            <span className="businesses-badge businesses-badge-sponsored">Patrocinado</span>
          ) : business.featured ? (
            <span className="businesses-badge businesses-badge-featured">Destacado</span>
          ) : null}
        </div>
        <div className="businesses-card-body">
          <h2>{business.title}</h2>
          {business.summary ? <p className="businesses-card-desc">{business.summary}</p> : null}
          <p className="businesses-card-location">{place}</p>
          <div className="businesses-card-owner">
            <span className="businesses-avatar">{ownerInitials(business.owner.displayName)}</span>
            <span>{business.owner.displayName}</span>
          </div>
          <dl className="businesses-card-meta">
            <div>
              <dt>{sortMetaLabel(sort)}</dt>
              <dd>{sortMetaValue(business, sort)}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{place}</dd>
            </div>
            <div>
              <dt>Actividad</dt>
              <dd>
                {business.views} visitas · {business.totalComments} comentarios
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {business.isOwn ? <span className="businesses-badge businesses-badge-own">Tu negocio</span> : null}
      <BusinessCardMenu businessId={business.id} isOwn={business.isOwn} title={business.title} />
    </article>
  );
}

export function BusinessGrid({
  businesses,
  sort,
  layout = "grid",
}: {
  businesses: PublicBusiness[];
  sort: BusinessSort;
  layout?: "grid" | "list";
}) {
  return (
    <div className={layout === "list" ? "businesses-grid businesses-grid-list" : "businesses-grid"}>
      {businesses.map((business) => (
        <BusinessCard business={business} key={business.id} layout={layout} sort={sort} />
      ))}
    </div>
  );
}

export function BusinessCategoryBar({
  categories,
  activeCategoryId,
  sort,
  layout,
  search,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  sort: BusinessSort;
  layout: "grid" | "list";
  search: string;
}) {
  return (
    <div aria-label="Filtrar por categoría" className="businesses-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "businesses-chip businesses-chip-active" : "businesses-chip"}
        href={buildBusinessesCatalogHref({ categoryId: null, sort, layout, search: search || undefined })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={
              activeCategoryId === category.id ? "businesses-chip businesses-chip-active" : "businesses-chip"
            }
            href={buildBusinessesCatalogHref({
              categoryId: category.id,
              sort,
              layout,
              search: search || undefined,
            })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function BusinessToolbar({
  search,
  categoryId,
  sort,
  layout,
  total,
  canCreate,
}: {
  search: string;
  categoryId: string | null;
  sort: BusinessSort;
  layout: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="businesses-toolbar">
      <form action="/businesses#businesses-catalog" className="businesses-toolbar-search" method="get">
        <label className="sr-only" htmlFor="businesses-search">
          Buscar negocios
        </label>
        <input
          defaultValue={search}
          id="businesses-search"
          maxLength={100}
          name="search"
          placeholder="Nombre, resumen o ubicación"
          type="search"
        />
        {sort !== "created" ? <input name="sort" type="hidden" value={sort} /> : null}
        {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
        {layout === "list" ? <input name="layout" type="hidden" value="list" /> : null}
        <button className="businesses-btn businesses-btn-secondary" type="submit">
          Buscar
        </button>
      </form>
      <div className="businesses-toolbar-controls">
        <label className="businesses-toolbar-sort" htmlFor="businesses-sort">
          <span>Ordenar por</span>
          <select
            id="businesses-sort"
            onChange={(event) => {
              router.push(
                buildBusinessesCatalogHref({
                  sort: event.target.value as BusinessSort,
                  layout,
                  categoryId,
                  search: search || undefined,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="updated">Actualizados</option>
            <option value="rating">Mejor valorados</option>
            <option value="views">Más vistos</option>
            <option value="comments">Más comentados</option>
          </select>
        </label>
        <p className="businesses-toolbar-count">{total === 1 ? "1 negocio" : `${total} negocios`}</p>
        <div aria-label="Modo de vista" className="businesses-view-toggle" role="group">
          <Link
            aria-current={layout === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={layout === "grid" ? "businesses-view-btn is-active" : "businesses-view-btn"}
            href={buildBusinessesCatalogHref({
              sort,
              layout: "grid",
              categoryId,
              search: search || undefined,
            })}
          >
            ▦
          </Link>
          <Link
            aria-current={layout === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={layout === "list" ? "businesses-view-btn is-active" : "businesses-view-btn"}
            href={buildBusinessesCatalogHref({
              sort,
              layout: "list",
              categoryId,
              search: search || undefined,
            })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="businesses-toolbar-note">Inicia sesión para crear un negocio.</p> : null}
    </div>
  );
}

export function BusinessPagination({
  page,
  pageCount,
  search,
  categoryId,
  sort,
  layout,
}: {
  page: number;
  pageCount: number;
  search: string;
  categoryId: string | null;
  sort: BusinessSort;
  layout: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) =>
    buildBusinessesCatalogHref({
      page: p,
      sort,
      layout,
      categoryId,
      search: search || undefined,
    });
  return (
    <nav aria-label="Paginación de negocios" className="businesses-pagination">
      {page > 1 ? (
        <Link className="businesses-btn businesses-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="businesses-btn businesses-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="businesses-btn businesses-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="businesses-btn businesses-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
