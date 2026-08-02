import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminGroupControls } from "@/app/components/admin-catalog-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminGroups } from "@/server/admin/group-mutations";

export default async function AdminGroupsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const groups = await listAdminGroups();

  return (
    <AdminShell current="groups" title="Grupos">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-groups-title">
        <p className="eyebrow">Administración · Grupos</p>
        <h1 id="admin-groups-title">Grupos</h1>
        <p className="lead">{groups.length} grupos. Controla la visibilidad en el catálogo cliente.</p>

        {groups.length > 0 ? (
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
                {groups.map((group) => (
                  <tr key={group.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/groups/${encodeURIComponent(group.id)}`}>
                        <strong>{group.title}</strong>
                        <small>{formatDate(group.createdAt)}</small>
                      </Link>
                    </th>
                    <td>@{group.owner.username}</td>
                    <td>{group.category?.title ?? "—"}</td>
                    <td>{group.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminGroupControls catalogVisible={group.catalogVisible} groupId={group.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay grupos registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
