import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteAlbumAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminAlbumForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminAlbumDetail } from "@/server/admin/content-crud";

export default async function AdminAlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminAlbumDetail(id);
  if (!item) redirect("/admin/albums");


  return (
    <AdminShell current="albums" title="Detalle de álbum">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/albums">
          ← Volver a álbumes
        </Link>
        <p className="eyebrow">Administración · Álbumes</p>
        <h1 id="admin-detail-title">{item.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Propietario</dt>
            <dd>@{item.owner.username}</dd>
          </div>
          <div>
            <dt>Archivos</dt>
            <dd>{item.totalFiles}</dd>
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
          <Link className="text-link" href={`/albums/${encodeURIComponent(item.id)}`}>
            Ver página pública →
          </Link>
        </p>
        <AdminAlbumForm
          mode="edit"
          album={{ id: item.id, title: item.title, description: item.description, catalogVisible: item.catalogVisible, searchable: item.searchable }}
        />
        <AdminDeleteForm
          action={adminDeleteAlbumAction}
          idFieldName="albumId"
          listPath="/admin/albums"
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
