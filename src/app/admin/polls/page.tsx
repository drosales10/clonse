import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPollControls } from "@/app/components/admin-poll-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminPolls } from "@/server/admin/poll-mutations";

export default async function AdminPollsPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const polls = await listAdminPolls();

  return (
    <AdminShell current="polls" title="Encuestas">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-polls-title">
        <p className="eyebrow">Administración · Encuestas</p>
        <h1 id="admin-polls-title">Encuestas</h1>
        <p className="lead">
          {polls.length} encuestas. Cierra o reabre votaciones y controla la visibilidad en el
          catálogo cliente.
        </p>

        {polls.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Votos</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {polls.map((poll) => (
                  <tr key={poll.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/polls/${encodeURIComponent(poll.id)}`}>
                        <strong>{poll.title}</strong>
                        <small>{formatDate(poll.createdAt)}</small>
                      </Link>
                    </th>
                    <td>
                      @{poll.owner.username}
                    </td>
                    <td>{poll.totalVotes}</td>
                    <td>{poll.closed ? "Cerrada" : "Abierta"}</td>
                    <td>{poll.catalogVisible ? "Visible" : "Oculta"}</td>
                    <td>
                      <AdminPollControls
                        catalogVisible={poll.catalogVisible}
                        closed={poll.closed}
                        pollId={poll.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay encuestas registradas.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
