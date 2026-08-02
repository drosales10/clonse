import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteSubnetworkAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminSubnetworkForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminSubnetworkDetail } from "@/server/admin/catalog-mutations";

export default async function AdminSubnetworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminSubnetworkDetail(id);
  if (!item) redirect("/admin/subnetworks");

  return (
    <AdminShell current="subnetworks" title="Detalle de subred">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/subnetworks">
          ← Volver a subredes
        </Link>
        <p className="eyebrow">Administración · Subredes</p>
        <h1 id="admin-detail-title">{`Subred ${item.legacyId ?? item.id}`}</h1>
        <dl className="profile-facts">
          <div>
            <dt>ID legacy</dt>
            <dd>{item.legacyId ?? "—"}</dd>
          </div>
          <div>
            <dt>Name legacy ID</dt>
            <dd>{item.nameLegacyId}</dd>
          </div>
          <div>
            <dt>Theme legacy ID</dt>
            <dd>{item.themeLegacyId}</dd>
          </div>

        </dl>
        <AdminSubnetworkForm
          mode="edit"
          subnetwork={{ id: item.id, nameLegacyId: item.nameLegacyId, field1Qualifier: item.field1Qualifier, field1Value: item.field1Value, field2Qualifier: item.field2Qualifier, field2Value: item.field2Value, themeLegacyId: item.themeLegacyId }}
        />
        <AdminDeleteForm
          action={adminDeleteSubnetworkAction}
          idFieldName="subnetworkId"
          listPath="/admin/subnetworks"
          resourceId={item.id}
          resourceLabel={`Subred ${item.legacyId ?? item.id}`}
        />
      </section>
    </AdminShell>
  );
}
