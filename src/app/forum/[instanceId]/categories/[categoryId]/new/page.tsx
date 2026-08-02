import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { normalizeForumQuery } from "@domain/forum";
import { CreateTopicForm } from "@/app/components/forum/create-topic-form";
import { ForumBreadcrumb, ForumUnavailable } from "@/app/components/forum/forum-ui";
import { matchesPublicIdentifier } from "@/app/components/forum/utils";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Nuevo tema | Foro" };

export default async function NewForumTopicPage({
  params,
}: {
  params: Promise<{ instanceId: string; categoryId: string }>;
}) {
  const { instanceId, categoryId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/forum/${instanceId}/categories/${categoryId}/new`);

  const catalog = await getForumCatalog(normalizeForumQuery({ instanceId, categoryId }), user.id);
  const category = catalog.categories.find((item) => matchesPublicIdentifier(item.id, item.legacyId, categoryId));
  const parent = category?.parentId ? catalog.categories.find((item) => item.id === category.parentId) : null;

  if (!catalog.instance || !category || !parent || category.parentId === null || category.isLocked) {
    return (
      <ClientShell current="explore">
        <div className="forum-module">
          <section className="forum-page">
            <ForumUnavailable
              actionHref={`/forum/${encodeURIComponent(instanceId)}`}
              actionLabel="Volver al foro"
              description="Esta categoría no admite nuevos temas o no está disponible."
              title="No puedes publicar aquí"
            />
          </section>
        </div>
      </ClientShell>
    );
  }

  const cancelHref = `/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(category.id)}`;

  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page forum-page-narrow" aria-labelledby="new-topic-title">
          <header className="forum-page-header">
            <ForumBreadcrumb
              items={[
                { label: "Inicio", href: "/home" },
                { label: "Foros", href: "/forum" },
                { label: catalog.instance.name ?? "Foro", href: `/forum/${encodeURIComponent(catalog.instance.id)}` },
                { label: category.title, href: cancelHref },
                { label: "Nuevo tema" },
              ]}
            />
            <div className="forum-page-heading">
              <div>
                <p className="forum-page-eyebrow">
                  {parent.title} · {category.title}
                </p>
                <h1 id="new-topic-title">Nuevo tema</h1>
                <p className="forum-page-lead">Comparte una pregunta o conversación con la comunidad.</p>
              </div>
              <Link className="forum-btn forum-btn-secondary" href={cancelHref}>
                Cancelar
              </Link>
            </div>
          </header>
          <CreateTopicForm cancelHref={cancelHref} categoryId={category.id} instanceId={catalog.instance.id} />
        </section>
      </div>
    </ClientShell>
  );
}
