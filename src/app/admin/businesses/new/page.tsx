import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminBusinessForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveBusinessCategories } from "@/server/businesses/service";

export default async function AdminBusinessNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveBusinessCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="businesses" title="Nuevo negocio">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/businesses"
          listLabel="Volver a negocios"
          newHref="/admin/businesses/new"
          newLabel="Nuevo negocio"
        />
        <p className="eyebrow">Administración · Negocios</p>
        <h1 id="admin-new-title">Nuevo negocio</h1>
        <AdminBusinessForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
