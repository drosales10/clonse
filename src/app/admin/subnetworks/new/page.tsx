import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminSubnetworkForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminSubnetworkNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="subnetworks" title="Nueva subred">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/subnetworks"
          listLabel="Volver a subredes"
          newHref="/admin/subnetworks/new"
          newLabel="Nueva subred"
        />
        <p className="eyebrow">Administración · Subredes</p>
        <h1 id="admin-new-title">Nueva subred</h1>
        <AdminSubnetworkForm mode="create" />
      </section>
    </AdminShell>
  );
}
