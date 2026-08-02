"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ArticleSort, PublicArticle } from "@domain/articles";

import { buildArticlesCatalogHref, formatArticleDate, ownerInitials } from "@/app/components/articles/utils";

type CategoryOption = { id: string; title: string; parentId: string | null };

function ArticleCardMenu({ articleId, isOwn, title }: { articleId: string; isOwn: boolean; title: string }) {
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
    <div className="articles-card-menu" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="articles-icon-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div className="articles-card-menu-panel" role="menu">
          <Link href={`/articles/${encodeURIComponent(articleId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver artículo
          </Link>
          {isOwn ? (
            <Link href={`/articles/${encodeURIComponent(articleId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
              Editar
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ArticleCard({ article, view = "grid" }: { article: PublicArticle; view?: "grid" | "list" }) {
  const href = `/articles/${encodeURIComponent(article.id)}`;
  return (
    <article className={view === "list" ? "articles-card articles-card-list" : "articles-card"}>
      <Link aria-label={`Ver artículo ${article.title}`} className="articles-card-link" href={href}>
        <div aria-hidden="true" className="articles-card-visual">
          <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
            <path
              d="M8 4h12l4 4v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm10 1v5h5M10 14h12M10 18h12M10 22h8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
          <span className="articles-category-badge">{article.category?.title ?? "Artículo"}</span>
          {article.featured ? <span className="articles-badge articles-badge-featured">Destacado</span> : null}
        </div>
        <div className="articles-card-body">
          <h2>{article.title}</h2>
          {article.excerpt ? <p className="articles-card-desc">{article.excerpt}</p> : null}
          <div className="articles-card-author">
            <span className="articles-avatar">{ownerInitials(article.author.displayName)}</span>
            <span>{article.author.displayName}</span>
          </div>
          <dl className="articles-card-meta">
            <div>
              <dt>Visitas</dt>
              <dd>{article.views}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{article.category?.title ?? "—"}</dd>
            </div>
            <div>
              <dt>Publicado</dt>
              <dd>
                <time dateTime={article.publishedAt.toISOString()}>{formatArticleDate(article.publishedAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
      {article.isOwn ? <span className="articles-badge articles-badge-own">Tu artículo</span> : null}
      <ArticleCardMenu articleId={article.id} isOwn={article.isOwn} title={article.title} />
    </article>
  );
}

export function ArticleGrid({ articles, view = "grid" }: { articles: PublicArticle[]; view?: "grid" | "list" }) {
  return (
    <div className={view === "list" ? "articles-grid articles-grid-list" : "articles-grid"}>
      {articles.map((article) => (
        <ArticleCard article={article} key={article.id} view={view} />
      ))}
    </div>
  );
}

export function ArticleCategoryBar({
  categories,
  activeCategoryId,
  search,
  sort,
  featured,
  layout,
}: {
  categories: CategoryOption[];
  activeCategoryId: string | null;
  search: string;
  sort: ArticleSort;
  featured: boolean;
  layout: "grid" | "list";
}) {
  return (
    <div aria-label="Filtrar por categoría" className="articles-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "articles-chip articles-chip-active" : "articles-chip"}
        href={buildArticlesCatalogHref({ categoryId: null, search, sort, featured, layout })}
      >
        Todos
      </Link>
      {categories
        .filter((category) => category.parentId === null)
        .map((category) => (
          <Link
            aria-current={activeCategoryId === category.id ? "page" : undefined}
            className={activeCategoryId === category.id ? "articles-chip articles-chip-active" : "articles-chip"}
            href={buildArticlesCatalogHref({ categoryId: category.id, search, sort, featured, layout })}
            key={category.id}
          >
            {category.title}
          </Link>
        ))}
    </div>
  );
}

export function ArticleToolbar({
  search,
  sort,
  categoryId,
  featured,
  layout,
  total,
  canCreate,
}: {
  search: string;
  sort: ArticleSort;
  categoryId: string | null;
  featured: boolean;
  layout: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  return (
    <div className="articles-toolbar">
      <form
        className="articles-toolbar-search"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(
            buildArticlesCatalogHref({
              search: query.trim(),
              sort,
              categoryId,
              featured,
              layout,
              page: 1,
            }),
          );
        }}
      >
        <label className="sr-only" htmlFor="articles-search">
          Buscar artículos
        </label>
        <input
          id="articles-search"
          maxLength={100}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título o contenido"
          type="search"
          value={query}
        />
        <button className="articles-btn articles-btn-secondary articles-toolbar-search-btn" type="submit">
          Buscar
        </button>
      </form>
      <div className="articles-toolbar-controls">
        <label className="articles-toolbar-sort" htmlFor="articles-sort">
          <span>Ordenar</span>
          <select
            id="articles-sort"
            onChange={(event) => {
              router.push(
                buildArticlesCatalogHref({
                  search,
                  sort: event.target.value as ArticleSort,
                  categoryId,
                  featured,
                  layout,
                  page: 1,
                }),
              );
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="views">Más vistos</option>
            <option value="title">Por título</option>
          </select>
        </label>
        <label className="articles-toolbar-featured">
          <input
            checked={featured}
            onChange={(event) => {
              router.push(
                buildArticlesCatalogHref({
                  search,
                  sort,
                  categoryId,
                  featured: event.target.checked,
                  layout,
                  page: 1,
                }),
              );
            }}
            type="checkbox"
          />
          <span>Solo destacados</span>
        </label>
        <p className="articles-toolbar-count">{total === 1 ? "1 artículo" : `${total} artículos`}</p>
        <div aria-label="Modo de vista" className="articles-view-toggle" role="group">
          <Link
            aria-current={layout === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={layout === "grid" ? "articles-view-btn is-active" : "articles-view-btn"}
            href={buildArticlesCatalogHref({ search, sort, categoryId, featured, layout: "grid" })}
          >
            ▦
          </Link>
          <Link
            aria-current={layout === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={layout === "list" ? "articles-view-btn is-active" : "articles-view-btn"}
            href={buildArticlesCatalogHref({ search, sort, categoryId, featured, layout: "list" })}
          >
            ☰
          </Link>
        </div>
      </div>
      {!canCreate ? <p className="articles-toolbar-note">Inicia sesión para crear un artículo.</p> : null}
    </div>
  );
}

export function ArticlePagination({
  page,
  pageCount,
  search,
  sort,
  categoryId,
  featured,
  layout,
}: {
  page: number;
  pageCount: number;
  search: string;
  sort: ArticleSort;
  categoryId: string | null;
  featured: boolean;
  layout: "grid" | "list";
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildArticlesCatalogHref({ page: p, search, sort, categoryId, featured, layout });
  return (
    <nav aria-label="Paginación de artículos" className="articles-pagination">
      {page > 1 ? (
        <Link className="articles-btn articles-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="articles-btn articles-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="articles-btn articles-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="articles-btn articles-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
