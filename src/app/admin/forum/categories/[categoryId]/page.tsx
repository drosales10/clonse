import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteForumCategoryAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminForumCategoryForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminForumCategoryDetail } from "@/server/admin/forum-mutations";

export default async function AdminForumCategoryDetailPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { categoryId } = await params;
  const category = await getAdminForumCategoryDetail(categoryId);
  if (!category) redirect("/admin/forum");

  return (
    <AdminShell current="forum" title="Detalle de categoría">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-forum-category-title">
        <Link className="text-link" href="/admin/forum">
          ← Volver al foro
        </Link>
        <p className="eyebrow">Administración · Foro</p>
        <h1 id="admin-forum-category-title">{category.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Instancia</dt>
            <dd>{category.instance.name ?? category.instance.id}</dd>
          </div>
          <div>
            <dt>Posición</dt>
            <dd>{category.position}</dd>
          </div>
          <div>
            <dt>Lectura pública</dt>
            <dd>{category.publicCanRead ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{category.isLocked ? "Bloqueada" : "Abierta"}</dd>
          </div>
        </dl>
        <p>
          <Link
            className="text-link"
            href={`/forum/${encodeURIComponent(category.instance.id)}/categories/${encodeURIComponent(category.id)}`}
          >
            Ver página pública →
          </Link>
        </p>
        <AdminForumCategoryForm
          category={{
            id: category.id,
            title: category.title,
            description: category.description,
            position: category.position,
            isLocked: category.isLocked,
            publicCanRead: category.publicCanRead,
          }}
        />
        <AdminDeleteForm
          action={adminDeleteForumCategoryAction}
          idFieldName="categoryId"
          listPath="/admin/forum"
          resourceId={category.id}
          resourceLabel={category.title}
        />
      </section>
    </AdminShell>
  );
}
