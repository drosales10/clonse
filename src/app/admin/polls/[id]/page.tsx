import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeletePollAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminPollForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminPollDetail } from "@/server/admin/content-crud";

export default async function AdminPollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminPollDetail(id);
  if (!item) redirect("/admin/polls");


  return (
    <AdminShell current="polls" title="Detalle de encuesta">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/polls">
          ← Volver a encuestas
        </Link>
        <p className="eyebrow">Administración · Encuestas</p>
        <h1 id="admin-detail-title">{item.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Propietario</dt>
            <dd>@{item.owner.username}</dd>
          </div>
          <div>
            <dt>Votos totales</dt>
            <dd>{item.totalVotes}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{item.closed ? "Cerrada" : "Abierta"}</dd>
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
          <Link className="text-link" href={`/polls/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminPollForm
          mode="edit"
          poll={{ id: item.id, title: item.title, description: item.description, options: item.options, closed: item.closed, catalogVisible: item.catalogVisible, searchable: item.searchable, totalVotes: item.totalVotes }}
        />
        <AdminDeleteForm
          action={adminDeletePollAction}
          idFieldName="pollId"
          listPath="/admin/polls"
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
