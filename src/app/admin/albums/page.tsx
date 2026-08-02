import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAlbumControls } from "@/app/components/admin-album-controls";
import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminAlbums } from "@/server/admin/album-mutations";

export default async function AdminAlbumsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const albums = await listAdminAlbums();

  return (
    <AdminShell current="albums" title="Álbumes">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-albums-title">
        <p className="eyebrow">Administración · Álbumes</p>
        <h1 id="admin-albums-title">Álbumes</h1>
        <p className="lead">
          {albums.length} álbumes. Controla la visibilidad en el catálogo cliente.
        </p>
        <AdminListToolbar
          listHref="/admin/albums"
          listLabel="Álbumes"
          newHref="/admin/albums/new"
          newLabel="Nuevo álbum"
        />

        {albums.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Archivos</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((album) => (
                  <tr key={album.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/albums/${encodeURIComponent(album.id)}`}>
                        <strong>{album.title}</strong>
                        <small>{formatDate(album.createdAt)}</small>
                      </Link>
                    </th>
                    <td>@{album.owner.username}</td>
                    <td>{album.totalFiles}</td>
                    <td>{album.catalogVisible ? "Visible" : "Oculta"}</td>
                    <td>
                      <AdminAlbumControls albumId={album.id} catalogVisible={album.catalogVisible} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay álbumes registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
