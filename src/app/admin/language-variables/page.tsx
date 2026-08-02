import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLanguageVariables } from "@/server/admin/catalogs";

export default async function AdminLanguageVariablesPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const variables = await getAdminLanguageVariables();

  return (
    <AdminShell current="language" title="Idioma">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-language-variables-title">
        <p className="eyebrow">Administración · Idioma</p>
        <h1 id="admin-language-variables-title">Variables de idioma</h1>
        <p className="lead">{variables.length} variables en el catálogo destino.</p>
        <AdminListToolbar
          listHref="/admin/language-variables"
          listLabel="Idioma"
          newHref="/admin/language-variables/new"
          newLabel="Nueva variable"
        />
        {variables.length === 0 ? (
          <p className="empty-state">El catálogo todavía no contiene filas importadas desde `se_languagevars`.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">ID variable</th>
                  <th scope="col">ID idioma</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable) => (
                  <tr key={variable.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/admin/language-variables/${encodeURIComponent(variable.id)}`}
                      >
                        <strong>{variable.legacyId}</strong>
                      </Link>
                    </th>
                    <td>{variable.languageId}</td>
                    <td>{variable.value || "—"}</td>
                    <td>{variable.defaultValue || "—"}</td>
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
