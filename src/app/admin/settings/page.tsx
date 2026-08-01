import Link from "next/link";
import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSettings } from "@/server/admin/catalogs";

export default async function AdminSettingsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const settings = await getAdminSettings();

  return (
    <main className="authenticated-shell admin-shell">
      <AdminHeader />
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-settings-title">
        <Link className="text-link" href="/admin/dashboard">← Volver al panel</Link>
        <p className="eyebrow">Administración · Configuración</p>
        <h1 id="admin-settings-title">Configuración global</h1>
        <p className="lead">{settings.length} registros de configuración no sensible. Este módulo es de solo lectura.</p>
        {settings.length === 0 ? (
          <p className="empty-state">Todavía no hay configuración importada desde `se_settings`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th scope="col">Clave</th><th scope="col">Versión</th><th scope="col">Estado</th><th scope="col">Username</th><th scope="col">Campo subnet 1</th><th scope="col">Campo subnet 2</th></tr></thead>
              <tbody>{settings.map((setting) => <tr key={setting.id}><th scope="row">{setting.key || "(sin clave)"}</th><td>{setting.version || "—"}</td><td>{setting.isOnline ? "Online" : "Offline"}</td><td>{setting.usernameEnabled ? "Permitido" : "No permitido"}</td><td>{setting.subnetField1Id}</td><td>{setting.subnetField2Id}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <p className="empty-state">Secretos, licencias, listas bloqueadas, serializados y configuración de módulos no se exponen aquí.</p>
      </section>
    </main>
  );
}

function AdminHeader() {
  return (
    <header className="app-header">
      <Link className="brand" href="/admin/dashboard">nexo<span>.</span></Link>
      <nav className="profile-navigation" aria-label="Navegación administrativa">
        <Link className="text-link" href="/admin/dashboard">Panel</Link>
        <Link className="text-link" href="/admin/users">Usuarios</Link>
        <Link className="text-link" href="/admin/levels">Niveles</Link>
        <Link className="text-link" href="/admin/subnetworks">Subredes</Link>
        <span className="text-link" aria-current="page">Configuración</span>
        <form action={adminLogoutAction}><button className="button button-quiet" type="submit">Cerrar sesión</button></form>
      </nav>
    </header>
  );
}
