import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminLevelForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminLevelNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="levels" title="Nuevo nivel">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/levels"
          listLabel="Volver a niveles"
          newHref="/admin/levels/new"
          newLabel="Nuevo nivel"
        />
        <p className="eyebrow">Administración · Niveles</p>
        <h1 id="admin-new-title">Nuevo nivel</h1>
        <AdminLevelForm mode="create" />
      </section>
    </AdminShell>
  );
}
