import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteForumTopicAction } from "@/app/actions/admin-content";
import { AdminModuleFlagsSection } from "@/app/components/admin/admin-module-flags-section";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminForumTopicForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminForumTopicDetail } from "@/server/admin/forum-mutations";

export default async function AdminForumTopicDetailPage({ params }: { params: Promise<{ topicId: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { topicId } = await params;
  const topic = await getAdminForumTopicDetail(topicId);
  if (!topic) redirect("/admin/forum");

  return (
    <AdminShell current="forum" title="Detalle de tema">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-forum-topic-title">
        <Link className="text-link" href="/admin/forum">
          ← Volver al foro
        </Link>
        <p className="eyebrow">Administración · Foro</p>
        <h1 id="admin-forum-topic-title">{topic.title}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Autor</dt>
            <dd>@{topic.author.username}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{topic.category.title}</dd>
          </div>
          <div>
            <dt>Instancia</dt>
            <dd>{topic.instance.name ?? topic.instance.id}</dd>
          </div>
          <div>
            <dt>Respuestas</dt>
            <dd>{topic.replyCount}</dd>
          </div>
          <div>
            <dt>Vistas</dt>
            <dd>{topic.views}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{formatDate(topic.createdAt)}</dd>
          </div>
        </dl>
        <p>
          <Link
            className="text-link"
            href={`/forum/${encodeURIComponent(topic.instance.id)}/topics/${encodeURIComponent(topic.id)}?categoryId=${encodeURIComponent(topic.category.id)}`}
          >
            Ver página pública →
          </Link>
        </p>
        <AdminModuleFlagsSection kind="forum-topic" resourceId={topic.id} />
        <AdminForumTopicForm
          topic={{
            id: topic.id,
            title: topic.title,
            body: topic.body,
          }}
        />
        <AdminDeleteForm
          action={adminDeleteForumTopicAction}
          idFieldName="topicId"
          listPath="/admin/forum"
          resourceId={topic.id}
          resourceLabel={topic.title}
        />
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
