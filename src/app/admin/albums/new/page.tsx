import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminAlbumForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminAlbumNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="albums" title="Nuevo álbum">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/albums"
          listLabel="Volver a álbumes"
          newHref="/admin/albums/new"
          newLabel="Nuevo álbum"
        />
        <p className="eyebrow">Administración · Álbumes</p>
        <h1 id="admin-new-title">Nuevo álbum</h1>
        <AdminAlbumForm mode="create" />
      </section>
    </AdminShell>
  );
}
