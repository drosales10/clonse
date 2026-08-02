import Link from "next/link";
import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLevels } from "@/server/admin/catalogs";

export default async function AdminLevelsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const levels = await getAdminLevels();

  return (
    <main className="authenticated-shell admin-shell">
      <AdminHeader current="Niveles" />
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-levels-title">
        <Link className="text-link" href="/admin/dashboard">← Volver al panel</Link>
        <p className="eyebrow">Administración · Niveles</p>
        <h1 id="admin-levels-title">Niveles de usuario</h1>
        <p className="lead">{levels.length} niveles en el catálogo destino. Este módulo es de solo lectura.</p>
        {levels.length === 0 ? (
          <p className="empty-state">El catálogo todavía no contiene filas importadas desde `se_levels`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th scope="col">Nombre</th><th scope="col">ID legacy</th><th scope="col">Registro</th><th scope="col">Predeterminado</th><th scope="col">Descripción</th></tr></thead>
              <tbody>{levels.map((level) => <tr key={level.id}><th scope="row">{level.name}</th><td>{level.legacyId ?? "—"}</td><td>{level.isSignup ? "Sí" : "No"}</td><td>{level.isDefault ? "Sí" : "No"}</td><td>{level.description || "—"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function AdminHeader({ current }: { current: string }) {
  return (
    <header className="app-header">
      <Link className="brand" href="/admin/dashboard">nexo<span>.</span></Link>
      <nav className="profile-navigation" aria-label="Navegación administrativa">
        <Link className="text-link" href="/admin/dashboard">Panel</Link>
        <Link className="text-link" href="/admin/users">Usuarios</Link>
        <span className="text-link" aria-current="page">{current}</span>
        <Link className="text-link" href="/admin/subnetworks">Subredes</Link>
        <Link className="text-link" href="/admin/settings">Configuración</Link>
        <Link className="text-link" href="/admin/language-variables">Idioma</Link>
        <form action={adminLogoutAction}><button className="button button-quiet" type="submit">Cerrar sesión</button></form>
      </nav>
    </header>
  );
}
