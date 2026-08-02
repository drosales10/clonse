import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumOwnerControls } from "@/app/components/album-owner-controls";
import { AlbumUploadForm } from "@/app/components/album-upload-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumDetail } from "@/server/albums/service";

export const metadata: Metadata = {
  title: "Álbum | nexo.",
  description: "Consulta un álbum visible de la comunidad.",
};

export default async function AlbumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ albumId: string }>;
  searchParams: Promise<{ mediaPage?: string }>;
}) {
  const { albumId } = await params;
  const query = await searchParams;
  const mediaPage = Number(query.mediaPage);
  const viewer = await getCurrentUser();
  const album = await getAlbumDetail(
    viewer?.id ?? null,
    albumId,
    Number.isInteger(mediaPage) && mediaPage > 0 ? mediaPage : 1,
  );
  if (!album) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel album-detail-panel" aria-labelledby="album-title">
        <Link className="text-link album-back-link" href="/albums">
          ← Volver a álbumes
        </Link>
        <p className="eyebrow">Álbum</p>
        <h1 id="album-title">{album.title}</h1>
        {!album.catalogVisible && album.isOwner ? (
          <p className="field-help" role="status">
            Este álbum está oculto del catálogo público.
          </p>
        ) : null}
        {album.description ? (
          <div className="album-detail-description">{album.description}</div>
        ) : (
          <p className="empty-state">Este álbum no tiene descripción.</p>
        )}
        <dl className="album-detail-facts">
          <div>
            <dt>Propietario</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(album.owner.username)}`}>
                {album.owner.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>
              <time dateTime={album.createdAt.toISOString()}>{formatDate(album.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>
              <time dateTime={album.updatedAt.toISOString()}>{formatDate(album.updatedAt)}</time>
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

        {album.isOwner ? (
          <AlbumOwnerControls
            albumId={album.id}
            catalogVisible={album.catalogVisible}
            description={album.description}
            title={album.title}
          />
        ) : null}

        {album.isOwner ? <AlbumUploadForm albumId={album.id} /> : null}

        <section className="album-media-section" aria-labelledby="album-media-title">
          <h2 id="album-media-title">Contenido</h2>
          {album.media.length > 0 ? (
            <ul className="album-media-grid">
              {album.media.map((item) => {
                const src = item.hasFile
                  ? `/api/albums/${encodeURIComponent(album.id)}/media/${encodeURIComponent(item.id)}`
                  : null;
                return (
                  <li className="album-media-card" key={item.id}>
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a className="album-media-preview" href={src} rel="noopener noreferrer">
                        <img alt={item.title} loading="lazy" src={src} />
                      </a>
                    ) : (
                      <div className="album-media-thumb" aria-hidden="true">
                        <span>{(item.extension || "file").toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <strong>{item.title}</strong>
                      {item.description ? <p>{item.description}</p> : null}
                      <small>
                        {item.extension || "sin extensión"}
                        {item.filesize > 0 ? ` · ${formatBytes(item.filesize)}` : ""}
                        {!item.hasFile ? " · sin archivo" : ""}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-state">Este álbum no tiene archivos todavía.</p>
          )}
          <MediaPagination albumId={album.id} pagination={album.mediaPagination} />
        </section>
      </article>
    </ClientShell>
  );
}

function MediaPagination({
  albumId,
  pagination,
}: {
  albumId: string;
  pagination: { page: number; pageCount: number };
}) {
  if (pagination.pageCount <= 1) return null;
  const href = (page: number) =>
    `/albums/${encodeURIComponent(albumId)}${page > 1 ? `?mediaPage=${page}` : ""}#album-media-title`;
  return (
    <nav aria-label="Paginación de archivos" className="album-pagination">
      {pagination.page > 1 ? (
        <Link className="text-link" href={href(pagination.page - 1)}>
          Anteriores
        </Link>
      ) : (
        <span aria-disabled="true">Anteriores</span>
      )}
      <span>
        Página {pagination.page} de {pagination.pageCount}
      </span>
      {pagination.page < pagination.pageCount ? (
        <Link className="text-link" href={href(pagination.page + 1)}>
          Siguientes
        </Link>
      ) : (
        <span aria-disabled="true">Siguientes</span>
      )}
    </nav>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
