import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteArticleAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminArticleForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminArticleDetail } from "@/server/admin/content-crud";
import { listActiveArticleCategories } from "@/server/articles/service";

export default async function AdminArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminArticleDetail(id),
    listActiveArticleCategories(),
  ]);
  if (!item) redirect("/admin/articles");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="articles" title="Detalle de artículo">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/articles">
          ← Volver a artículos
        </Link>
        <p className="eyebrow">Administración · Artículos</p>
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
            <dt>Borrador</dt>
            <dd>{item.draft ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt>Aprobado</dt>
            <dd>{item.approved ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt>Vistas</dt>
            <dd>{item.views}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{formatDate(item.publishedAt)}</dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
        <p>
          <Link className="text-link" href={`/articles/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="article" resourceId={item.id} />
        <AdminArticleForm
          mode="edit"
          categories={categoryOptions}
          article={{ id: item.id, title: item.title, body: item.body, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable, draft: item.draft, approved: item.approved }}
        />
        <AdminDeleteForm
          action={adminDeleteArticleAction}
          idFieldName="articleId"
          listPath="/admin/articles"
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
