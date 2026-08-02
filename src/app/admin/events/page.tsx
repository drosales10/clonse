import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminEventControls } from "@/app/components/admin-catalog-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminEvents } from "@/server/admin/event-mutations";

export default async function AdminEventsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const events = await listAdminEvents();

  return (
    <AdminShell current="events" title="Eventos">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-events-title">
        <p className="eyebrow">Administración · Eventos</p>
        <h1 id="admin-events-title">Eventos</h1>
        <p className="lead">{events.length} eventos. Controla la visibilidad en el catálogo cliente.</p>

        {events.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/events/${encodeURIComponent(event.id)}`}>
                        <strong>{event.title}</strong>
                        <small>{event.category?.title ?? "Sin categoría"}</small>
                      </Link>
                    </th>
                    <td>@{event.owner.username}</td>
                    <td>{event.startsAt ? formatDate(event.startsAt) : "—"}</td>
                    <td>{event.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminEventControls catalogVisible={event.catalogVisible} eventId={event.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay eventos registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
