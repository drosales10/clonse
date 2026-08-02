import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminSettingForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminSettingNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="settings" title="Nuevo ajuste">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/settings"
          listLabel="Volver a configuración"
          newHref="/admin/settings/new"
          newLabel="Nuevo ajuste"
        />
        <p className="eyebrow">Administración · Configuración</p>
        <h1 id="admin-new-title">Nuevo ajuste</h1>
        <AdminSettingForm mode="create" />
      </section>
    </AdminShell>
  );
}
