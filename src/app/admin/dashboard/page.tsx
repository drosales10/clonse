import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminDashboardPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <main className="authenticated-shell admin-shell">
      <header className="app-header">
        <span className="brand">nexo<span>.</span></span>
        <nav className="profile-navigation" aria-label="Navegación administrativa">
          <span className="text-link">Administración</span>
          <form action={adminLogoutAction}><button className="button button-quiet" type="submit">Cerrar sesión</button></form>
        </nav>
      </header>
      <section className="welcome-panel" aria-labelledby="admin-dashboard-title">
        <p className="eyebrow">Consola administrativa</p>
        <h1 id="admin-dashboard-title">Hola, {access.admin.displayName}</h1>
        <p className="lead">La sesión administrativa está activa para <strong>{access.admin.username}</strong>.</p>
        <p className="empty-state">El dashboard funcional y los módulos de gestión se habilitarán cuando se complete la importación controlada de permisos, niveles y datos administrativos.</p>
      </section>
    </main>
  );
}
