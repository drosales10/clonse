import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminBlogControls } from "@/app/components/admin-catalog-controls";
import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminBlogs } from "@/server/admin/blog-mutations";

export default async function AdminBlogsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const entries = await listAdminBlogs();

  return (
    <AdminShell current="blogs" title="Blogs">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-blogs-title">
        <p className="eyebrow">Administración · Blogs</p>
        <h1 id="admin-blogs-title">Blogs</h1>
        <p className="lead">{entries.length} entradas. Controla la visibilidad en el catálogo cliente.</p>
        <AdminListToolbar
          listHref="/admin/blogs"
          listLabel="Blogs"
          newHref="/admin/blogs/new"
          newLabel="Nueva entrada"
        />

        {entries.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/blogs/${encodeURIComponent(entry.id)}`}>
                        <strong>{entry.title}</strong>
                        <small>{formatDate(entry.createdAt)}</small>
                      </Link>
                    </th>
                    <td>@{entry.author.username}</td>
                    <td>{entry.category?.title ?? "—"}</td>
                    <td>{entry.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminBlogControls catalogVisible={entry.catalogVisible} entryId={entry.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay entradas de blog registradas.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
