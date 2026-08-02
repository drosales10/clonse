import Link from "next/link";

import type { PublicAlbumDetail } from "@domain/albums";

import { AlbumBreadcrumb } from "@/app/components/albums/ui/breadcrumb";
import { formatAlbumDateTime, ownerInitials } from "@/app/components/albums/utils";

export function AlbumHeader({
  album,
}: {
  album: PublicAlbumDetail;
}) {
  return (
    <header className="albums-detail-header">
      <AlbumBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Albums", href: "/albums" },
          { label: album.title },
        ]}
      />
      <div className="albums-detail-heading">
        <div>
          <h1>{album.title}</h1>
          {album.description ? (
            <p className="albums-detail-description">{album.description}</p>
          ) : (
            <p className="albums-detail-description albums-detail-description-muted">
              Este álbum no tiene descripción.
            </p>
          )}
        </div>
        <div className="albums-detail-actions">
          <Link className="albums-btn albums-btn-secondary" href="/albums">
            Volver a Albums
          </Link>
          {album.isOwner ? (
            <>
              <Link className="albums-btn albums-btn-secondary" href={`/albums/${encodeURIComponent(album.id)}/edit`}>
                Editar álbum
              </Link>
              <Link className="albums-btn albums-btn-primary" href={`/albums/${encodeURIComponent(album.id)}/upload`}>
                Subir fotografías
              </Link>
            </>
          ) : null}
        </div>
      </div>
      <div className="albums-detail-owner">
        <span aria-hidden="true" className="albums-avatar albums-avatar-lg">
          {ownerInitials(album.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(album.owner.username)}`}>{album.owner.displayName}</Link>
          <p>@{album.owner.username}</p>
        </div>
      </div>
      <dl className="albums-detail-facts">
        <div>
          <dt>Creado</dt>
          <dd>
            <time dateTime={album.createdAt.toISOString()}>{formatAlbumDateTime(album.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Actualizado</dt>
          <dd>
            <time dateTime={album.updatedAt.toISOString()}>{formatAlbumDateTime(album.updatedAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Fotografías</dt>
          <dd>{album.totalFiles}</dd>
        </div>
        <div>
          <dt>Visualizaciones</dt>
          <dd>{album.views}</dd>
        </div>
      </dl>
      {!album.catalogVisible && album.isOwner ? (
        <p className="albums-inline-notice" role="status">
          Este álbum está oculto del catálogo público. Solo tú puedes verlo en la lista general si accedes directamente.
        </p>
      ) : null}
    </header>
  );
}

export function AlbumMediaPagination({
  albumId,
  pagination,
}: {
  albumId: string;
  pagination: { page: number; pageCount: number; start: number; end: number; total: number };
}) {
  const href = (page: number) =>
    `/albums/${encodeURIComponent(albumId)}${page > 1 ? `?mediaPage=${page}` : ""}#album-media`;

  return (
    <nav aria-label="Paginación de fotografías" className="albums-pagination albums-media-pagination">
      <p>
        {pagination.total === 0
          ? "Sin fotografías"
          : `Mostrando ${pagination.start}–${pagination.end} de ${pagination.total} fotografías`}
      </p>
      <div className="albums-pagination-controls">
        {pagination.page > 1 ? (
          <Link className="albums-btn albums-btn-secondary" href={href(pagination.page - 1)}>
            Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className="albums-btn albums-btn-secondary is-disabled">
            Anterior
          </span>
        )}
        <span>
          Página {pagination.page} de {pagination.pageCount}
        </span>
        {pagination.page < pagination.pageCount ? (
          <Link className="albums-btn albums-btn-secondary" href={href(pagination.page + 1)}>
            Siguiente
          </Link>
        ) : (
          <span aria-disabled="true" className="albums-btn albums-btn-secondary is-disabled">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
