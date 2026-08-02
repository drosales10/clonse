import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteLevelAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminLevelForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLevelDetail } from "@/server/admin/catalog-mutations";

export default async function AdminLevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminLevelDetail(id);
  if (!item) redirect("/admin/levels");

  return (
    <AdminShell current="levels" title="Detalle de nivel">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/levels">
          ← Volver a niveles
        </Link>
        <p className="eyebrow">Administración · Niveles</p>
        <h1 id="admin-detail-title">{item.name}</h1>
        <dl className="profile-facts">
          <div>
            <dt>ID legacy</dt>
            <dd>{item.legacyId ?? "—"}</dd>
          </div>
          <div>
            <dt>Predeterminado</dt>
            <dd>{item.isDefault ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt>Registro</dt>
            <dd>{item.isSignup ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt>Descripción</dt>
            <dd>{item.description || "—"}</dd>
          </div>

        </dl>
        <AdminLevelForm
          mode="edit"
          level={{ id: item.id, name: item.name, description: item.description, isDefault: item.isDefault, isSignup: item.isSignup }}
        />
        <AdminDeleteForm
          action={adminDeleteLevelAction}
          idFieldName="levelId"
          listPath="/admin/levels"
          resourceId={item.id}
          resourceLabel={item.name}
        />
      </section>
    </AdminShell>
  );
}
