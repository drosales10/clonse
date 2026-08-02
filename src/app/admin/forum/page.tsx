import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminForumCategoryControls,
  AdminForumTopicControls,
} from "@/app/components/admin-forum-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import {
  listAdminForumCategories,
  listAdminForumTopics,
} from "@/server/admin/forum-mutations";

export default async function AdminForumPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const [topics, categories] = await Promise.all([
    listAdminForumTopics(),
    listAdminForumCategories(),
  ]);

  return (
    <AdminShell current="forum" title="Foro">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-forum-title">
        <p className="eyebrow">Administración · Foro</p>
        <h1 id="admin-forum-title">Moderación del foro</h1>
        <p className="lead">
          Bloquea o desbloquea categorías y temas. Los usuarios no podrán publicar ni responder en
          contenido bloqueado.
        </p>

        <h2 className="admin-section-title">Temas recientes</h2>
        {topics.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Flags</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/admin/forum/topics/${encodeURIComponent(topic.id)}`}
                      >
                        <strong>{topic.title}</strong>
                        <small>{topic.replyCount} respuestas</small>
                      </Link>
                    </th>
                    <td>@{topic.author.username}</td>
                    <td>{topic.category.title}</td>
                    <td>{topic.isLocked ? "Bloqueado" : "Abierto"}</td>
                    <td>
                      {topic.isAnnouncement ? "Anuncio" : "—"}
                      {topic.isSticky ? " · Fijado" : ""}
                    </td>
                    <td>
                      <AdminForumTopicControls
                        isAnnouncement={topic.isAnnouncement}
                        isLocked={topic.isLocked}
                        isSticky={topic.isSticky}
                        topicId={topic.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No hay temas registrados.</p>
        )}

        <h2 className="admin-section-title">Categorías</h2>
        {categories.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Categoría</th>
                  <th scope="col">Instancia</th>
                  <th scope="col">Pública</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <th scope="row">
                      <Link
                        className="admin-user-link"
                        href={`/admin/forum/categories/${encodeURIComponent(category.id)}`}
                      >
                        <strong>{category.title}</strong>
                      </Link>
                    </th>
                    <td>{category.instance.name ?? category.instance.id}</td>
                    <td>{category.publicCanRead ? "Sí" : "No"}</td>
                    <td>{category.isLocked ? "Bloqueada" : "Abierta"}</td>
                    <td>
                      <AdminForumCategoryControls
                        categoryId={category.id}
                        isLocked={category.isLocked}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No hay categorías registradas.</p>
        )}
      </section>
    </AdminShell>
  );
}
