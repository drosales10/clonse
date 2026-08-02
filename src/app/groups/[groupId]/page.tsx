import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GroupOwnerControls } from "@/app/components/group-owner-controls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupDetail, listActiveGroupCategories } from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Grupo | nexo.",
  description: "Consulta un grupo visible de la comunidad.",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const viewer = await getCurrentUser();
  const [group, categories] = await Promise.all([
    getGroupDetail(viewer?.id ?? null, groupId),
    listActiveGroupCategories(),
  ]);
  if (!group) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel group-detail-panel" aria-labelledby="group-title">
        <Link className="text-link group-back-link" href="/groups">
          ← Volver a grupos
        </Link>
        <p className="eyebrow">{group.category?.title ?? "Grupo"}</p>
        <h1 id="group-title">{group.title}</h1>
        {!group.catalogVisible && group.isOwner ? (
          <p className="field-help" role="status">
            Este grupo está oculto del catálogo público.
          </p>
        ) : null}
        {group.description ? (
          <div className="group-detail-description">{group.description}</div>
        ) : (
          <p className="empty-state">Este grupo no tiene descripción.</p>
        )}
        <dl className="group-detail-facts">
          <div>
            <dt>Propietario</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(group.owner.username)}`}>
                {group.owner.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>
              <time dateTime={group.createdAt.toISOString()}>{formatDate(group.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>
              <time dateTime={group.updatedAt.toISOString()}>{formatDate(group.updatedAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Visitas</dt>
            <dd>{group.views}</dd>
          </div>
        </dl>

        {group.isOwner ? (
          <GroupOwnerControls
            catalogVisible={group.catalogVisible}
            categories={categories}
            categoryId={group.categoryId}
            description={group.description}
            groupId={group.id}
            title={group.title}
          />
        ) : null}

        <p className="group-detail-note">
          Miembros, discusiones, fotos e invitaciones quedan fuera de este corte.
        </p>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
