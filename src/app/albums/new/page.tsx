import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateAlbumForm } from "@/app/components/albums/create-album-form";
import { AlbumBreadcrumb } from "@/app/components/albums/ui/breadcrumb";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Crear álbum | nexo.",
  description: "Crea un álbum para compartir fotografías con la comunidad.",
};

export default async function NewAlbumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/albums/new");

  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <section className="albums-page albums-page-narrow" aria-labelledby="new-album-title">
          <AlbumBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Albums", href: "/albums" },
              { label: "Crear álbum" },
            ]}
          />
          <header className="albums-page-header">
            <h1 id="new-album-title">Crear álbum</h1>
            <p className="albums-page-lead">
              Define un título y la visibilidad inicial. Después podrás subir fotografías desde el detalle.
            </p>
          </header>
          <CreateAlbumForm cancelHref="/albums" />
        </section>
      </div>
    </ClientShell>
  );
}
