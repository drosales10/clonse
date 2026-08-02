import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteGroupAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminGroupForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminGroupDetail } from "@/server/admin/content-crud";
import { listActiveGroupCategories } from "@/server/groups/service";

export default async function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminGroupDetail(id),
    listActiveGroupCategories(),
  ]);
  if (!item) redirect("/admin/groups");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="groups" title="Detalle de grupo">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/groups">
          ← Volver a grupos
        </Link>
        <p className="eyebrow">Administración · Grupos</p>
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
          <Link className="text-link" href={`/groups/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="group" resourceId={item.id} />
        <AdminGroupForm
          mode="edit"
          categories={categoryOptions}
          group={{ id: item.id, title: item.title, description: item.description, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable, membershipApprovalRequired: item.membershipApprovalRequired }}
        />
        <AdminDeleteForm
          action={adminDeleteGroupAction}
          idFieldName="groupId"
          listPath="/admin/groups"
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
