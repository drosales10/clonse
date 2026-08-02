import type { Metadata } from "next";
import Link from "next/link";

import { normalizeAlbumQuery, type AlbumSort } from "@domain/albums";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumCatalog } from "@/server/albums/service";

export const metadata: Metadata = {
  title: "Álbumes | nexo.",
  description: "Explora álbumes visibles de la comunidad.",
};

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: AlbumSort = sortRaw === "updated" ? "updated" : "created";
  const query = normalizeAlbumQuery({
    page: readNumber(params.page),
    sort,
  });
  const viewer = await getCurrentUser();
  const catalog = await getAlbumCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel album-panel" aria-labelledby="albums-title">
        <p className="eyebrow">Multimedia · Álbumes</p>
        <h1 id="albums-title">Álbumes</h1>
        <p className="lead">
          Explora álbumes publicados. Puedes crear el tuyo y subir imágenes (JPG, PNG, GIF, WebP).
        </p>

        <div className="poll-toolbar">
          {viewer ? (
            <Link className="button button-primary button-small" href="/albums/new">
              Crear álbum
            </Link>
          ) : (
            <Link className="text-link" href="/login?returnUrl=/albums/new">
              Inicia sesión para crear un álbum
            </Link>
          )}
        </div>

        <div className="album-sort-bar" aria-label="Ordenar álbumes">
          <Link
            className={query.sort === "created" ? "category-chip category-chip-active" : "category-chip"}
            href="/albums#albums-title"
          >
            Más recientes
          </Link>
          <Link
            className={query.sort === "updated" ? "category-chip category-chip-active" : "category-chip"}
            href="/albums?sort=updated#albums-title"
          >
            Actualizados
          </Link>
        </div>

        {catalog.items.length > 0 ? (
          <div className="album-list">
            {catalog.items.map((album) => (
              <article className="album-card" key={album.id}>
                <div className="album-card-cover" aria-hidden="true">
                  <span>{album.totalFiles}</span>
                  <small>archivos</small>
                </div>
                <div className="album-card-body">
                  <p className="eyebrow">Álbum</p>
                  <h2>
                    <Link className="album-card-link" href={`/albums/${encodeURIComponent(album.id)}`}>
                      {album.title}
                    </Link>
                  </h2>
                  {album.description ? <p className="album-summary">{album.description}</p> : null}
                  <dl className="album-facts">
                    <div>
                      <dt>Propietario</dt>
                      <dd>
                        <Link href={`/profile/${encodeURIComponent(album.owner.username)}`}>
                          {album.owner.displayName}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt>Visitas</dt>
                      <dd>{album.views}</dd>
                    </div>
                    <div>
                      <dt>Archivos</dt>
                      <dd>{album.totalFiles}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Todavía no hay álbumes autorizados en el catálogo público.
          </p>
        )}

        <AlbumPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} sort={query.sort} />
      </section>
    </ClientShell>
  );
}

function AlbumPagination({
  page,
  pageCount,
  sort,
}: {
  page: number;
  pageCount: number;
  sort: AlbumSort;
}) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (sort === "updated") params.set("sort", "updated");
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/albums${query ? `?${query}` : ""}#albums-title`;
  };
  return (
    <nav aria-label="Paginación de álbumes" className="album-pagination">
      {page > 1 ? (
        <Link className="text-link" href={href(page - 1)}>
          Anteriores
        </Link>
      ) : (
        <span aria-disabled="true">Anteriores</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="text-link" href={href(page + 1)}>
          Siguientes
        </Link>
      ) : (
        <span aria-disabled="true">Siguientes</span>
      )}
    </nav>
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
