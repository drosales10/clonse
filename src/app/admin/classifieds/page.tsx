import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminClassifiedControls } from "@/app/components/admin-catalog-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminClassifieds } from "@/server/admin/classified-mutations";

export default async function AdminClassifiedsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const classifieds = await listAdminClassifieds();

  return (
    <AdminShell current="classifieds" title="Clasificados">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-classifieds-title">
        <p className="eyebrow">Administración · Clasificados</p>
        <h1 id="admin-classifieds-title">Clasificados</h1>
        <p className="lead">
          {classifieds.length} clasificados. Controla la visibilidad en el catálogo cliente.
        </p>

        {classifieds.length > 0 ? (
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
                {classifieds.map((classified) => (
                  <tr key={classified.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/classifieds/${encodeURIComponent(classified.id)}`}
                      >
                        <strong>{classified.title}</strong>
                        <small>{formatDate(classified.createdAt)}</small>
                      </Link>
                    </th>
                    <td>@{classified.owner.username}</td>
                    <td>{classified.category?.title ?? "—"}</td>
                    <td>{classified.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminClassifiedControls
                        catalogVisible={classified.catalogVisible}
                        classifiedId={classified.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay clasificados registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
