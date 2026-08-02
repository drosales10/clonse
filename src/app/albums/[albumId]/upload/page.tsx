import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AlbumBreadcrumb } from "@/app/components/albums/ui/breadcrumb";
import { UploadMediaPanel } from "@/app/components/albums/upload-media-panel";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumDetail } from "@/server/albums/service";

export const metadata: Metadata = {
  title: "Subir fotografías | nexo.",
};

export default async function UploadAlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/albums/${encodeURIComponent((await params).albumId)}/upload`);

  const { albumId } = await params;
  const album = await getAlbumDetail(user.id, albumId, 1);
  if (!album) notFound();
  if (!album.isOwner) redirect(`/albums/${encodeURIComponent(albumId)}`);

  const cancelHref = `/albums/${encodeURIComponent(albumId)}`;

  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <section className="albums-page albums-page-narrow" aria-labelledby="upload-album-title">
          <AlbumBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Albums", href: "/albums" },
              { label: album.title, href: cancelHref },
              { label: "Subir fotografías" },
            ]}
          />
          <header className="albums-page-header">
            <h1 id="upload-album-title">Subir fotografías</h1>
            <p className="albums-page-lead">
              Añade imágenes a <strong>{album.title}</strong>. Puedes subir varios archivos a la vez.
            </p>
          </header>
          <UploadMediaPanel albumId={album.id} cancelHref={cancelHref} />
        </section>
      </div>
    </ClientShell>
  );
}
