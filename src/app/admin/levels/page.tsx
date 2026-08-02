import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLevels } from "@/server/admin/catalogs";

export default async function AdminLevelsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const levels = await getAdminLevels();

  return (
    <AdminShell current="levels" title="Niveles">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-levels-title">
        <p className="eyebrow">Administración · Niveles</p>
        <h1 id="admin-levels-title">Niveles de usuario</h1>
        <p className="lead">{levels.length} niveles en el catálogo destino.</p>
        <AdminListToolbar
          listHref="/admin/levels"
          listLabel="Niveles"
          newHref="/admin/levels/new"
          newLabel="Nuevo nivel"
        />
        {levels.length === 0 ? (
          <p className="empty-state">El catálogo todavía no contiene filas importadas desde `se_levels`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">ID legacy</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Predeterminado</th>
                  <th scope="col">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/levels/${encodeURIComponent(level.id)}`}>
                        <strong>{level.name}</strong>
                      </Link>
                    </th>
                    <td>{level.legacyId ?? "—"}</td>
                    <td>{level.isSignup ? "Sí" : "No"}</td>
                    <td>{level.isDefault ? "Sí" : "No"}</td>
                    <td>{level.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
