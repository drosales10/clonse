import { redirect } from "next/navigation";

import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminEventForm } from "@/app/components/admin/content-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listActiveEventCategories } from "@/server/events/service";

export default async function AdminEventNewPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const categories = await listActiveEventCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title, parentId: c.parentId }));

  return (
    <AdminShell current="events" title="Nuevo evento">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-new-title">
        <AdminListToolbar
          listHref="/admin/events"
          listLabel="Volver a eventos"
          newHref="/admin/events/new"
          newLabel="Nuevo evento"
        />
        <p className="eyebrow">Administración · Eventos</p>
        <h1 id="admin-new-title">Nuevo evento</h1>
        <AdminEventForm mode="create" categories={categoryOptions} />
      </section>
    </AdminShell>
  );
}
