import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlbumCreateForm } from "@/app/components/album-create-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Nuevo álbum | nexo.",
  description: "Crea un álbum para compartir imágenes.",
};

export default async function NewAlbumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/albums/new");

  return (
    <ClientShell current="explore">
      <section className="profile-panel album-panel" aria-labelledby="new-album-title">
        <Link className="text-link album-back-link" href="/albums">
          ← Volver a álbumes
        </Link>
        <p className="eyebrow">Multimedia · Álbumes</p>
        <h1 id="new-album-title">Nuevo álbum</h1>
        <p className="lead">
          Crea un álbum visible en el catálogo. Después podrás subir imágenes desde el detalle.
        </p>
        <AlbumCreateForm />
      </section>
    </ClientShell>
  );
}
