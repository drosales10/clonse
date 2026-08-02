import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteBlogAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminBlogForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminBlogDetail } from "@/server/admin/content-crud";
import { listActiveBlogCategories } from "@/server/blogs/service";

export default async function AdminBlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminBlogDetail(id),
    listActiveBlogCategories(),
  ]);
  if (!item) redirect("/admin/blogs");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="blogs" title="Detalle de blog">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/blogs">
          ← Volver a blogs
        </Link>
        <p className="eyebrow">Administración · Blogs</p>
        <h1 id="admin-detail-title">{item.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Autor</dt>
            <dd>@{item.author.username}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{item.category?.title ?? "—"}</dd>
          </div>
          <div>
            <dt>Vistas</dt>
            <dd>{item.views}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{formatDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
        <p>
          <Link className="text-link" href={`/blogs/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="blog" resourceId={item.id} />
        <AdminBlogForm
          mode="edit"
          categories={categoryOptions}
          entry={{ id: item.id, title: item.title, body: item.body, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable }}
        />
        <AdminDeleteForm
          action={adminDeleteBlogAction}
          idFieldName="entryId"
          listPath="/admin/blogs"
          resourceId={item.id}
          resourceLabel={item.title}
        />
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
