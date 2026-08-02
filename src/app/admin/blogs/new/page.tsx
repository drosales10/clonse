import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminBlogForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveBlogCategories } from "@/server/blogs/service";

export default async function AdminBlogNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveBlogCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="blogs" title="Nueva entrada">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/blogs"
          listLabel="Volver a blogs"
          newHref="/admin/blogs/new"
          newLabel="Nueva entrada"
        />
        <p className="eyebrow">Administración · Blogs</p>
        <h1 id="admin-new-title">Nueva entrada de blog</h1>
        <AdminBlogForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
