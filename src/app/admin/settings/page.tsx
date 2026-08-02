import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSettings } from "@/server/admin/catalogs";

export default async function AdminSettingsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const settings = await getAdminSettings();

  return (
    <AdminShell current="settings" title="Configuración">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-settings-title">
        <p className="eyebrow">Administración · Configuración</p>
        <h1 id="admin-settings-title">Configuración global</h1>
        <p className="lead">{settings.length} registros de configuración no sensible.</p>
        <AdminListToolbar
          listHref="/admin/settings"
          listLabel="Configuración"
          newHref="/admin/settings/new"
          newLabel="Nuevo ajuste"
        />
        {settings.length === 0 ? (
          <p className="empty-state">Todavía no hay configuración importada desde `se_settings`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Clave</th>
                  <th scope="col">Versión</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Username</th>
                  <th scope="col">Campo subnet 1</th>
                  <th scope="col">Campo subnet 2</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/settings/${encodeURIComponent(setting.id)}`}>
                        <strong>{setting.key || "(sin clave)"}</strong>
                      </Link>
                    </th>
                    <td>{setting.version || "—"}</td>
                    <td>{setting.isOnline ? "Online" : "Offline"}</td>
                    <td>{setting.usernameEnabled ? "Permitido" : "No permitido"}</td>
                    <td>{setting.subnetField1Id}</td>
                    <td>{setting.subnetField2Id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="empty-state">
          Secretos, licencias, listas bloqueadas, serializados y configuración de módulos no se exponen aquí.
        </p>
      </section>
    </AdminShell>
  );
}
