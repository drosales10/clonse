import type { Metadata } from "next";
import Link from "next/link";

import { normalizeAlbumQuery, type AlbumSort } from "@domain/albums";
import { AlbumGrid, AlbumPagination, AlbumToolbar } from "@/app/components/albums/album-catalog";
import { EmptyState } from "@/app/components/albums/ui/empty-state";
import { PermissionNotice } from "@/app/components/albums/ui/permission-notice";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumCatalog } from "@/server/albums/service";

export const metadata: Metadata = {
  title: "Albums | nexo.",
  description: "Explora las colecciones de fotos compartidas por la comunidad.",
};

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: AlbumSort = sortRaw === "updated" ? "updated" : "created";
  const viewRaw = readString(params.view);
  const view = viewRaw === "list" ? "list" : "grid";
  const query = normalizeAlbumQuery({
    page: readNumber(params.page),
    sort,
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getAlbumCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <section className="albums-page" aria-labelledby="albums-title" id="albums-catalog">
          <header className="albums-page-header">
            <nav aria-label="Ruta de navegación" className="albums-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Albums</span>
                </li>
              </ol>
            </nav>
            <div className="albums-page-heading">
              <div>
                <h1 id="albums-title">Albums</h1>
                <p className="albums-page-lead">
                  Explora las colecciones de fotos compartidas por la comunidad.
                </p>
              </div>
              {canCreate ? (
                <Link className="albums-btn albums-btn-primary" href="/albums/new">
                  Crear álbum
                </Link>
              ) : null}
            </div>
          </header>

          {!viewer ? <PermissionNotice loginHref="/login?returnUrl=/albums/new" /> : null}

          <AlbumToolbar canCreate={canCreate} sort={query.sort} total={catalog.pagination.total} view={view} />

          {catalog.items.length > 0 ? (
            <AlbumGrid albums={catalog.items} sort={query.sort} view={view} />
          ) : (
            <EmptyState
              action={
                canCreate ? (
                  <Link className="albums-btn albums-btn-primary" href="/albums/new">
                    Crear tu primer álbum
                  </Link>
                ) : undefined
              }
              description="Cuando la comunidad publique colecciones, aparecerán aquí."
              icon={
                <svg fill="none" height="48" viewBox="0 0 48 48" width="48">
                  <rect height="32" rx="6" stroke="currentColor" strokeWidth="2" width="40" x="4" y="10" />
                  <circle cx="17" cy="22" fill="currentColor" r="4" />
                  <path d="M8 36l10-10 8 8 6-6 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              }
              title="Todavía no hay álbumes para mostrar"
            />
          )}

          <AlbumPagination
            page={catalog.pagination.page}
            pageCount={catalog.pagination.pageCount}
            sort={query.sort}
            view={view}
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
