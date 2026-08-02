import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminPollForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminPollNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  return (
    <AdminShell current="polls" title="Nueva encuesta">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/polls"
          listLabel="Volver a encuestas"
          newHref="/admin/polls/new"
          newLabel="Nueva encuesta"
        />
        <p className="eyebrow">Administración · Encuestas</p>
        <h1 id="admin-new-title">Nueva encuesta</h1>
        <AdminPollForm mode="create" />
      </section>
    </AdminShell>
  );
}
