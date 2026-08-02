import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { normalizeForumQuery } from "@domain/forum";
import { ForumTopicCreateForm } from "@/app/components/forum-topic-create-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getForumCatalog } from "@/server/forum/service";

function matchesPublicIdentifier(id: string, legacyId: number | null, identifier: string): boolean {
  return id === identifier || (legacyId !== null && legacyId > 0 && String(legacyId) === identifier);
}

export const metadata: Metadata = { title: "Nuevo tema | Foro" };

export default async function NewForumTopicPage({
  params,
}: {
  params: Promise<{ instanceId: string; categoryId: string }>;
}) {
  const { instanceId, categoryId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/forum/${instanceId}/categories/${categoryId}/new`);

  const catalog = await getForumCatalog(normalizeForumQuery({ instanceId, categoryId }));
  const category = catalog.categories.find((item) => matchesPublicIdentifier(item.id, item.legacyId, categoryId));
  const parent = category?.parentId ? catalog.categories.find((item) => item.id === category.parentId) : null;

  if (!catalog.instance || !category || !parent || category.parentId === null || category.isLocked) {
    return (
      <main className="public-shell">
        <section className="auth-card">
          <p className="eyebrow">Foros</p>
          <h1>No puedes publicar aquí</h1>
          <p className="lead">Esta categoría no admite nuevos temas o no está disponible.</p>
          <Link className="button button-primary" href={`/forum/${instanceId}`}>
            Volver al foro
          </Link>
        </section>
      </main>
    );
  }

  return (
    <ClientShell current="explore">
      <section className="profile-panel forum-panel" aria-labelledby="new-topic-title">
        <Link
          className="text-link forum-back-link"
          href={`/forum/${instanceId}/categories/${category.id}`}
        >
          ← Volver a {category.title}
        </Link>
        <p className="eyebrow">
          {parent.title} · {category.title}
        </p>
        <h1 id="new-topic-title">Nuevo tema</h1>
        <p className="lead">Comparte una pregunta o conversación con la comunidad.</p>
        <ForumTopicCreateForm categoryId={category.id} instanceId={catalog.instance.id} />
      </section>
    </ClientShell>
  );
}
