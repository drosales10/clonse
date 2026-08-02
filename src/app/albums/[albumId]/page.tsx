import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumHeader, AlbumMediaPagination } from "@/app/components/albums/album-header";
import { MediaGallery } from "@/app/components/albums/media-gallery";
import { EmptyState } from "@/app/components/albums/ui/empty-state";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumDetail } from "@/server/albums/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ albumId: string }>;
}): Promise<Metadata> {
  const { albumId } = await params;
  const viewer = await getCurrentUser();
  const album = await getAlbumDetail(viewer?.id ?? null, albumId, 1);
  return {
    title: album ? `${album.title} | Albums` : "Álbum | nexo.",
    description: album?.description ?? "Consulta un álbum de la comunidad.",
  };
}

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
      <div className="albums-module">
        <article className="albums-page albums-detail-page" aria-labelledby="album-title">
          <AlbumHeader album={album} />

          <section aria-labelledby="album-media-title" className="albums-media-section" id="album-media">
            <h2 id="album-media-title">Galería</h2>
            {album.media.length > 0 ? (
              <>
                <MediaGallery albumId={album.id} media={album.media} />
                <AlbumMediaPagination albumId={album.id} pagination={album.mediaPagination} />
              </>
            ) : (
              <EmptyState
                action={
                  album.isOwner ? (
                    <Link
                      className="albums-btn albums-btn-primary"
                      href={`/albums/${encodeURIComponent(album.id)}/upload`}
                    >
                      Subir la primera fotografía
                    </Link>
                  ) : undefined
                }
                description={
                  album.isOwner
                    ? "Añade imágenes para que los visitantes puedan explorar tu colección."
                    : "Vuelve más tarde para ver si el propietario añade contenido."
                }
                title="Este álbum todavía no contiene fotografías"
              />
            )}
          </section>
        </article>
      </div>
    </ClientShell>
  );
}
