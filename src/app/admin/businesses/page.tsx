import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminBusinessControls } from "@/app/components/admin-catalog-controls";
import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminBusinesses } from "@/server/admin/business-mutations";

export default async function AdminBusinessesPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const businesses = await listAdminBusinesses();

  return (
    <AdminShell current="businesses" title="Negocios">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-businesses-title">
        <p className="eyebrow">Administración · Negocios</p>
        <h1 id="admin-businesses-title">Negocios</h1>
        <p className="lead">{businesses.length} negocios. Controla la visibilidad en el catálogo cliente.</p>
        <AdminListToolbar
          listHref="/admin/businesses"
          listLabel="Negocios"
          newHref="/admin/businesses/new"
          newLabel="Nuevo negocio"
        />

        {businesses.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Propietario</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/admin/businesses/${encodeURIComponent(business.id)}`}
                      >
                        <strong>{business.title}</strong>
                        <small>{formatDate(business.createdAt)}</small>
                      </Link>
                    </th>
                    <td>@{business.owner.username}</td>
                    <td>{business.category?.title ?? "—"}</td>
                    <td>{business.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminBusinessControls
                        businessId={business.id}
                        catalogVisible={business.catalogVisible}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay negocios registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
