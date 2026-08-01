import Link from "next/link";
import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSubnetworks } from "@/server/admin/catalogs";

export default async function AdminSubnetworksPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const subnetworks = await getAdminSubnetworks();

  return (
    <main className="authenticated-shell admin-shell">
      <AdminHeader />
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-subnetworks-title">
        <Link className="text-link" href="/admin/dashboard">← Volver al panel</Link>
        <p className="eyebrow">Administración · Subredes</p>
        <h1 id="admin-subnetworks-title">Subredes</h1>
        <p className="lead">{subnetworks.length} subredes en el catálogo destino. Este módulo es de solo lectura.</p>
        {subnetworks.length === 0 ? (
          <p className="empty-state">El catálogo todavía no contiene filas importadas desde `se_subnets`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th scope="col">ID legacy</th><th scope="col">Nombre i18n</th><th scope="col">Regla primaria</th><th scope="col">Regla secundaria</th><th scope="col">Tema legacy</th></tr></thead>
              <tbody>{subnetworks.map((subnetwork) => <tr key={subnetwork.id}><th scope="row">{subnetwork.legacyId ?? "—"}</th><td>{subnetwork.nameLegacyId}</td><td>{formatRule(subnetwork.field1Qualifier, subnetwork.field1Value)}</td><td>{formatRule(subnetwork.field2Qualifier, subnetwork.field2Value)}</td><td>{subnetwork.themeLegacyId}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <p className="empty-state">Los nombres localizados y la evaluación de reglas no se resuelven en esta fase.</p>
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
        <span className="text-link" aria-current="page">Subredes</span>
        <form action={adminLogoutAction}><button className="button button-quiet" type="submit">Cerrar sesión</button></form>
      </nav>
    </header>
  );
}

function formatRule(qualifier: string, value: string): string {
  if (!qualifier && !value) return "—";
  return `${qualifier || "?"}: ${value || "—"}`;
}
