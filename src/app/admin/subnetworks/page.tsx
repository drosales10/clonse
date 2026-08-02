import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSubnetworks } from "@/server/admin/catalogs";

export default async function AdminSubnetworksPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const subnetworks = await getAdminSubnetworks();

  return (
    <AdminShell current="subnetworks" title="Subredes">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-subnetworks-title">
        <p className="eyebrow">Administración · Subredes</p>
        <h1 id="admin-subnetworks-title">Subredes</h1>
        <p className="lead">{subnetworks.length} subredes en el catálogo destino.</p>
        <AdminListToolbar
          listHref="/admin/subnetworks"
          listLabel="Subredes"
          newHref="/admin/subnetworks/new"
          newLabel="Nueva subred"
        />
        {subnetworks.length === 0 ? (
          <p className="empty-state">El catálogo todavía no contiene filas importadas desde `se_subnets`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">ID legacy</th>
                  <th scope="col">Nombre i18n</th>
                  <th scope="col">Regla primaria</th>
                  <th scope="col">Regla secundaria</th>
                  <th scope="col">Tema legacy</th>
                </tr>
              </thead>
              <tbody>
                {subnetworks.map((subnetwork) => (
                  <tr key={subnetwork.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/admin/subnetworks/${encodeURIComponent(subnetwork.id)}`}
                      >
                        <strong>{subnetwork.legacyId ?? "—"}</strong>
                      </Link>
                    </th>
                    <td>{subnetwork.nameLegacyId}</td>
                    <td>{formatRule(subnetwork.field1Qualifier, subnetwork.field1Value)}</td>
                    <td>{formatRule(subnetwork.field2Qualifier, subnetwork.field2Value)}</td>
                    <td>{subnetwork.themeLegacyId}</td>
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

function formatRule(qualifier: string, value: string): string {
  if (!qualifier && !value) return "—";
  return `${qualifier || "?"}: ${value || "—"}`;
}
