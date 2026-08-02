import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminClassifiedForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveClassifiedCategories } from "@/server/classifieds/service";

export default async function AdminClassifiedNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveClassifiedCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="classifieds" title="Nuevo clasificado">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/classifieds"
          listLabel="Volver a clasificados"
          newHref="/admin/classifieds/new"
          newLabel="Nuevo clasificado"
        />
        <p className="eyebrow">Administración · Clasificados</p>
        <h1 id="admin-new-title">Nuevo clasificado</h1>
        <AdminClassifiedForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
