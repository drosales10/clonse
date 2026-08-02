import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteClassifiedAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminClassifiedForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminClassifiedDetail } from "@/server/admin/content-crud";
import { listActiveClassifiedCategories } from "@/server/classifieds/service";

export default async function AdminClassifiedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminClassifiedDetail(id),
    listActiveClassifiedCategories(),
  ]);
  if (!item) redirect("/admin/classifieds");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="classifieds" title="Detalle de clasificado">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/classifieds">
          ← Volver a clasificados
        </Link>
        <p className="eyebrow">Administración · Clasificados</p>
        <h1 id="admin-detail-title">{item.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Propietario</dt>
            <dd>@{item.owner.username}</dd>
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
          <Link className="text-link" href={`/classifieds/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="classified" resourceId={item.id} />
        <AdminClassifiedForm
          mode="edit"
          categories={categoryOptions}
          classified={{ id: item.id, title: item.title, body: item.body, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable }}
        />
        <AdminDeleteForm
          action={adminDeleteClassifiedAction}
          idFieldName="classifiedId"
          listPath="/admin/classifieds"
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
