import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteSettingAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminSettingForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSettingDetail } from "@/server/admin/catalog-mutations";

export default async function AdminSettingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminSettingDetail(id);
  if (!item) redirect("/admin/settings");

  return (
    <AdminShell current="settings" title="Detalle de ajuste">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/settings">
          ← Volver a configuración
        </Link>
        <p className="eyebrow">Administración · Configuración</p>
        <h1 id="admin-detail-title">{item.key || "(sin clave)"}</h1>
        <dl className="profile-facts">
          <div>
            <dt>ID legacy</dt>
            <dd>{item.legacyId ?? "—"}</dd>
          </div>
          <div>
            <dt>Versión</dt>
            <dd>{item.version || "—"}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{item.isOnline ? "Online" : "Offline"}</dd>
          </div>

        </dl>
        <AdminSettingForm
          mode="edit"
          setting={{ id: item.id, key: item.key, version: item.version, isOnline: item.isOnline, urlEnabled: item.urlEnabled, usernameEnabled: item.usernameEnabled, subnetField1Id: item.subnetField1Id, subnetField2Id: item.subnetField2Id }}
        />
        <AdminDeleteForm
          action={adminDeleteSettingAction}
          idFieldName="settingId"
          listPath="/admin/settings"
          resourceId={item.id}
          resourceLabel={item.key || "(sin clave)"}
        />
      </section>
    </AdminShell>
  );
}
