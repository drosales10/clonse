import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminDashboardStats } from "@/server/admin/dashboard";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminDashboardPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");
  const stats = await getAdminDashboardStats();

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
        <div className="scope-grid">
          <article><span>01</span><h2>{stats.totalUsers}</h2><p>Usuarios registrados en el destino.</p></article>
          <article><span>02</span><h2>{stats.enabledUsers}</h2><p>Usuarios habilitados actualmente.</p></article>
          <article><span>03</span><h2>{stats.verifiedUsers}</h2><p>Usuarios con email verificado.</p></article>
        </div>
        <p className="empty-state">Estas son las únicas métricas administrativas disponibles con modelos destino verificados. Mensajes, reportes, amistades, anuncios, logins y estadísticas legacy quedan pendientes de sus contratos.</p>
      </section>
    </main>
  );
}
