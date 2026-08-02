import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminGroupForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveGroupCategories } from "@/server/groups/service";

export default async function AdminGroupNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveGroupCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="groups" title="Nuevo grupo">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/groups"
          listLabel="Volver a grupos"
          newHref="/admin/groups/new"
          newLabel="Nuevo grupo"
        />
        <p className="eyebrow">Administración · Grupos</p>
        <h1 id="admin-new-title">Nuevo grupo</h1>
        <AdminGroupForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
