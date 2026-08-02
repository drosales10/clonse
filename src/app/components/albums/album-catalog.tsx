"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PublicAlbum } from "@domain/albums";
import type { AlbumSort } from "@domain/albums";

import { albumCoverSrc, buildAlbumsCatalogHref, formatAlbumDate, ownerInitials } from "@/app/components/albums/utils";

function IconGrid() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="6" x="1.5" y="1.5" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="6" x="10.5" y="1.5" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="6" x="1.5" y="10.5" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="6" x="10.5" y="10.5" />
    </svg>
  );
}

function IconList() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
      <rect height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="15" x="1.5" y="2.5" />
      <rect height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="15" x="1.5" y="7.5" />
      <rect height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="15" x="1.5" y="12.5" />
    </svg>
  );
}

export function AlbumCard({
  album,
  sort,
  view = "grid",
}: {
  album: PublicAlbum;
  sort: AlbumSort;
  view?: "grid" | "list";
}) {
  const href = `/albums/${encodeURIComponent(album.id)}`;
  const cover = albumCoverSrc(album.id, album.coverMediaId);
  const dateLabel = sort === "updated" ? "Actualizado" : "Creado";
  const dateValue = sort === "updated" ? album.updatedAt : album.createdAt;

  return (
    <article className={view === "list" ? "albums-card albums-card-list" : "albums-card"}>
      <Link aria-label={`Ver álbum ${album.title}`} className="albums-card-link" href={href}>
        <div className="albums-card-cover">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" loading="lazy" src={cover} />
          ) : (
            <div className="albums-card-cover-placeholder" aria-hidden="true">
              <svg fill="none" height="40" viewBox="0 0 40 40" width="40">
                <rect height="28" rx="4" stroke="currentColor" strokeWidth="2" width="32" x="4" y="8" />
                <circle cx="14" cy="16" fill="currentColor" r="3" />
                <path d="M8 30l8-8 6 6 4-4 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
              <span>Sin portada</span>
            </div>
          )}
          {album.isOwn ? <span className="albums-badge albums-badge-own">Tu álbum</span> : null}
        </div>
        <div className="albums-card-body">
          <h2>{album.title}</h2>
          {album.description ? <p className="albums-card-desc">{album.description}</p> : null}
          <div className="albums-card-owner">
            <span aria-hidden="true" className="albums-avatar">
              {ownerInitials(album.owner.displayName)}
            </span>
            <span>{album.owner.displayName}</span>
          </div>
          <dl className="albums-card-meta">
            <div>
              <dt>{dateLabel}</dt>
              <dd>
                <time dateTime={new Date(dateValue).toISOString()}>{formatAlbumDate(dateValue)}</time>
              </dd>
            </div>
            <div>
              <dt>Fotos</dt>
              <dd>{album.totalFiles}</dd>
            </div>
            <div>
              <dt>Visitas</dt>
              <dd>{album.views}</dd>
            </div>
          </dl>
        </div>
      </Link>
      <AlbumCardMenu albumId={album.id} isOwn={album.isOwn} title={album.title} />
    </article>
  );
}

function AlbumCardMenu({ albumId, isOwn, title }: { albumId: string; isOwn: boolean; title: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="albums-card-menu" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opciones de ${title}`}
        className="albums-icon-btn"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 18 18" width="18">
          <circle cx="9" cy="3.5" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="9" cy="14.5" r="1.5" />
        </svg>
      </button>
      {open ? (
        <div className="albums-card-menu-panel" role="menu">
          <Link href={`/albums/${encodeURIComponent(albumId)}`} onClick={() => setOpen(false)} role="menuitem">
            Ver álbum
          </Link>
          {isOwn ? (
            <>
              <Link href={`/albums/${encodeURIComponent(albumId)}/edit`} onClick={() => setOpen(false)} role="menuitem">
                Editar
              </Link>
              <Link href={`/albums/${encodeURIComponent(albumId)}/upload`} onClick={() => setOpen(false)} role="menuitem">
                Subir fotografías
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AlbumGrid({
  albums,
  sort,
  view = "grid",
}: {
  albums: PublicAlbum[];
  sort: AlbumSort;
  view?: "grid" | "list";
}) {
  return (
    <div className={view === "list" ? "albums-grid albums-grid-list" : "albums-grid"}>
      {albums.map((album) => (
        <AlbumCard album={album} key={album.id} sort={sort} view={view} />
      ))}
    </div>
  );
}

export function AlbumToolbar({
  sort,
  view,
  total,
  canCreate,
}: {
  sort: AlbumSort;
  view: "grid" | "list";
  total: number;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="albums-toolbar">
      <div className="albums-toolbar-search">
        <label className="sr-only" htmlFor="albums-search">
          Buscar álbumes
        </label>
        <input
          disabled
          id="albums-search"
          placeholder="Buscar álbumes (próximamente)"
          type="search"
        />
      </div>
      <div className="albums-toolbar-controls">
        <label className="albums-toolbar-sort" htmlFor="albums-sort">
          <span>Ordenar por</span>
          <select
            id="albums-sort"
            onChange={(event) => {
              const nextSort = event.target.value === "updated" ? "updated" : "created";
              router.push(buildAlbumsCatalogHref({ sort: nextSort, view, page: 1 }));
            }}
            value={sort}
          >
            <option value="created">Más recientes</option>
            <option value="updated">Última actualización</option>
          </select>
        </label>
        <p aria-live="polite" className="albums-toolbar-count">
          {total === 1 ? "1 álbum" : `${total} álbumes`}
        </p>
        <div aria-label="Modo de vista" className="albums-view-toggle" role="group">
          <Link
            aria-current={view === "grid" ? "true" : undefined}
            aria-label="Vista de cuadrícula"
            className={view === "grid" ? "albums-view-btn is-active" : "albums-view-btn"}
            href={buildAlbumsCatalogHref({ sort, view: "grid" })}
          >
            <IconGrid />
          </Link>
          <Link
            aria-current={view === "list" ? "true" : undefined}
            aria-label="Vista de lista"
            className={view === "list" ? "albums-view-btn is-active" : "albums-view-btn"}
            href={buildAlbumsCatalogHref({ sort, view: "list" })}
          >
            <IconList />
          </Link>
        </div>
      </div>
      {!canCreate ? (
        <p className="albums-toolbar-note">Inicia sesión para crear un álbum.</p>
      ) : null}
    </div>
  );
}

export function AlbumPagination({
  page,
  pageCount,
  sort,
  view,
}: {
  page: number;
  pageCount: number;
  sort: AlbumSort;
  view: "grid" | "list";
}) {
  if (pageCount <= 1) return null;

  const href = (nextPage: number) => buildAlbumsCatalogHref({ page: nextPage, sort, view });

  return (
    <nav aria-label="Paginación de álbumes" className="albums-pagination">
      {page > 1 ? (
        <Link className="albums-btn albums-btn-secondary" href={href(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className="albums-btn albums-btn-secondary is-disabled">
          Anterior
        </span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="albums-btn albums-btn-secondary" href={href(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span aria-disabled="true" className="albums-btn albums-btn-secondary is-disabled">
          Siguiente
        </span>
      )}
    </nav>
  );
}
