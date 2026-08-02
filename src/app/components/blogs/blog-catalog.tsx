"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { BlogSort, PublicBlogEntry } from "@domain/blogs";

import { buildBlogsCatalogHref, formatBlogDate, ownerInitials } from "@/app/components/blogs/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function BlogCardMenu({ entryId, isOwn, title }: { entryId: string; isOwn: boolean; title: string }) {
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
    <div className="blogs-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="blogs-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="blogs-card-menu-panel" role="menu">
          <Link href={`/blogs/${encodeURIComponent(entryId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver entrada
          </Link>
          {isOwn ? (
            <Link href={`/blogs/${encodeURIComponent(entryId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BlogCard({ entry, view = "grid" }: { entry: PublicBlogEntry; view?: "grid" | "list" }) {
  const href = `/blogs/${encodeURIComponent(entry.id)}`;
  return (
    <article className={view === "list" ? "blogs-card blogs-card-list" : "blogs-card"}>
      <Link aria-label={`Ver entrada ${entry.title}`} className="blogs-card-link" href={href}>
        <div aria-hidden="true" className="blogs-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M8 6h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 4v2h12v-2H10zm0 4v2h12v-2H10zm0 4v2h8v-2h-8z"
              fill="currentColor"
            />
          </svg>
          <span className="blogs-category-badge">{entry.category?.title ?? "Blog"}</span>
        </div>
        <div className="blogs-card-body">
          <h2>{entry.title}</h2>
          {entry.excerpt ? <p className="blogs-card-desc">{entry.excerpt}</p> : null}
          <div className="blogs-card-author">
            <span className="blogs-avatar">{ownerInitials(entry.author.displayName)}</span>
            <span>{entry.author.displayName}</span>
          </div>
          <dl className="blogs-card-meta">
            <div>
              <dt>Visitas</dt>
              <dd>{entry.views}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{entry.category?.title ?? "—"}</dd>
            </div>
            <div>
              <dt>Publicado</dt>
              <dd>
                <time dateTime={entry.createdAt.toISOString()}>{formatBlogDate(entry.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {entry.isOwn ? <span className="blogs-badge blogs-badge-own">Tu entrada</span> : null}
      <BlogCardMenu entryId={entry.id} isOwn={entry.isOwn} title={entry.title} />
    </article>
  );
}

export function BlogGrid({ entries, view = "grid" }: { entries: PublicBlogEntry[]; view?: "grid" | "list" }) {
  return (
    <div className={view === "list" ? "blogs-grid blogs-grid-list" : "blogs-grid"}>
      {entries.map((entry) => (
        <BlogCard entry={entry} key={entry.id} view={view} />
      ))}
    </div>
  );
}

export function BlogCategoryBar({
  categories,
  activeCategoryId,
  search,
  sort,
  layout,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  search: string;
  sort: BlogSort;
  layout: "grid" | "list";
}) {
  return (
    <div aria-label="Filtrar por categoría" className="blogs-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "blogs-chip blogs-chip-active" : "blogs-chip"}
        href={buildBlogsCatalogHref({ categoryId: null, search, sort, layout })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={activeCategoryId === category.id ? "blogs-chip blogs-chip-active" : "blogs-chip"}
            href={buildBlogsCatalogHref({ categoryId: category.id, search, sort, layout })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function BlogToolbar({
  search,
  sort,
  categoryId,
  layout,
  total,
  canCreate,
}: {
  search: string;
  sort: BlogSort;
  categoryId: string | null;
  layout: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  return (
    <div className="blogs-toolbar">
      <form
        className="blogs-toolbar-search"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(
            buildBlogsCatalogHref({
              search: query.trim(),
              sort,
              categoryId,
              layout,
              page: 1,
            }),
          );
        }}
      >
        <label className="sr-only" htmlFor="blogs-search">
          Buscar entradas
        </label>
        <input
          id="blogs-search"
          maxLength={100}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título o contenido"
          type="search"
          value={query}
        />
        <button className="blogs-btn blogs-btn-secondary blogs-toolbar-search-btn" type="submit">
          Buscar
        </button>
      </form>
      <div className="blogs-toolbar-controls">
        <label className="blogs-toolbar-sort" htmlFor="blogs-sort">
          <span>Ordenar</span>
          <select
            id="blogs-sort"
            onChange={(event) => {
              router.push(
                buildBlogsCatalogHref({
                  search,
                  sort: event.target.value as BlogSort,
                  categoryId,
                  layout,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="views">Más vistos</option>
          </select>
        </label>
        <p className="blogs-toolbar-count">{total === 1 ? "1 entrada" : `${total} entradas`}</p>
        <div aria-label="Modo de vista" className="blogs-view-toggle" role="group">
          <Link
            aria-current={layout === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={layout === "grid" ? "blogs-view-btn is-active" : "blogs-view-btn"}
            href={buildBlogsCatalogHref({ search, sort, categoryId, layout: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={layout === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={layout === "list" ? "blogs-view-btn is-active" : "blogs-view-btn"}
            href={buildBlogsCatalogHref({ search, sort, categoryId, layout: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="blogs-toolbar-note">Inicia sesión para crear una entrada.</p> : null}
    </div>
  );
}

export function BlogPagination({
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
  sort: BlogSort;
  categoryId: string | null;
  layout: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildBlogsCatalogHref({ page: p, search, sort, categoryId, layout });
  return (
    <nav aria-label="Paginación de blogs" className="blogs-pagination">
      {page > 1 ? (
        <Link className="blogs-btn blogs-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="blogs-btn blogs-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="blogs-btn blogs-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="blogs-btn blogs-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
