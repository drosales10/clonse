import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditAlbumForm } from "@/app/components/albums/edit-album-form";
import { AlbumBreadcrumb } from "@/app/components/albums/ui/breadcrumb";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getAlbumDetail } from "@/server/albums/service";

export const metadata: Metadata = {
  title: "Editar álbum | nexo.",
};

export default async function EditAlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/albums/${encodeURIComponent((await params).albumId)}/edit`);

  const { albumId } = await params;
  const album = await getAlbumDetail(user.id, albumId, 1);
  if (!album) notFound();
  if (!album.isOwner) redirect(`/albums/${encodeURIComponent(albumId)}`);

  const cancelHref = `/albums/${encodeURIComponent(albumId)}`;

  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <section className="albums-page albums-page-narrow" aria-labelledby="edit-album-title">
          <AlbumBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Albums", href: "/albums" },
              { label: album.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="albums-page-header">
            <h1 id="edit-album-title">Editar álbum</h1>
            <p className="albums-page-lead">Actualiza la información del álbum o gestiona su visibilidad.</p>
          </header>
          <EditAlbumForm
            albumId={album.id}
            cancelHref={cancelHref}
            catalogVisible={album.catalogVisible}
            description={album.description}
            title={album.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
