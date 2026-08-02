import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteBusinessAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminBusinessForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminBusinessDetail } from "@/server/admin/content-crud";
import { listActiveBusinessCategories } from "@/server/businesses/service";

export default async function AdminBusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminBusinessDetail(id),
    listActiveBusinessCategories(),
  ]);
  if (!item) redirect("/admin/businesses");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="businesses" title="Detalle de negocio">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/businesses">
          ← Volver a negocios
        </Link>
        <p className="eyebrow">Administración · Negocios</p>
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
          <Link className="text-link" href={`/businesses/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="business" resourceId={item.id} />
        <AdminBusinessForm
          mode="edit"
          categories={categoryOptions}
          business={{ id: item.id, title: item.title, summary: item.summary, description: item.description, city: item.city, province: item.province, country: item.country, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable }}
        />
        <AdminDeleteForm
          action={adminDeleteBusinessAction}
          idFieldName="businessId"
          listPath="/admin/businesses"
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
