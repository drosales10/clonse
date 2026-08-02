import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminArticleForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveArticleCategories } from "@/server/articles/service";

export default async function AdminArticleNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveArticleCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="articles" title="Nuevo artículo">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/articles"
          listLabel="Volver a artículos"
          newHref="/admin/articles/new"
          newLabel="Nuevo artículo"
        />
        <p className="eyebrow">Administración · Artículos</p>
        <h1 id="admin-new-title">Nuevo artículo</h1>
        <AdminArticleForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
