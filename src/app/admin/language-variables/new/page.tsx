import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminLanguageVariableForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminLanguageVariableNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="language" title="Nueva variable">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/language-variables"
          listLabel="Volver a idioma"
          newHref="/admin/language-variables/new"
          newLabel="Nueva variable"
        />
        <p className="eyebrow">Administración · Idioma</p>
        <h1 id="admin-new-title">Nueva variable de idioma</h1>
        <AdminLanguageVariableForm mode="create" />
      </section>
    </AdminShell>
  );
}
