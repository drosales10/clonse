import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteEventAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminEventForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminEventDetail } from "@/server/admin/content-crud";
import { listActiveEventCategories } from "@/server/events/service";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getAdminEventDetail(id),
    listActiveEventCategories(),
  ]);
  if (!item) redirect("/admin/events");

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="events" title="Detalle de evento">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/events">
          ← Volver a eventos
        </Link>
        <p className="eyebrow">Administración · Eventos</p>
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
            <dt>Inicio</dt>
            <dd>{item.startsAt ? formatDate(item.startsAt) : "—"}</dd>
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
          <Link className="text-link" href={`/events/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="event" resourceId={item.id} />
        <AdminEventForm
          mode="edit"
          categories={categoryOptions}
          event={{ id: item.id, title: item.title, description: item.description, host: item.host, location: item.location, startsAt: item.startsAt, endsAt: item.endsAt, categoryId: item.categoryId, catalogVisible: item.catalogVisible, searchable: item.searchable, inviteOnly: item.inviteOnly }}
        />
        <AdminDeleteForm
          action={adminDeleteEventAction}
          idFieldName="eventId"
          listPath="/admin/events"
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
