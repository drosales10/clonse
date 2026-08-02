import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClassifiedOwnerControls } from "@/app/components/classified-owner-controls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedDetail, listActiveClassifiedCategories } from "@/server/classifieds/service";

export const metadata: Metadata = {
  title: "Clasificado | Red Social",
  description: "Consulta un clasificado visible de la comunidad.",
};

export default async function ClassifiedDetailPage({
  params,
}: {
  params: Promise<{ classifiedId: string }>;
}) {
  const { classifiedId } = await params;
  const viewer = await getCurrentUser();
  const [classified, categories] = await Promise.all([
    getClassifiedDetail(viewer?.id ?? null, classifiedId),
    listActiveClassifiedCategories(),
  ]);
  if (!classified) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel classified-detail-panel" aria-labelledby="classified-title">
        <Link className="text-link classified-back-link" href="/classifieds">
          ← Volver a clasificados
        </Link>
        <p className="eyebrow">{classified.category?.title ?? "Clasificado"}</p>
        <h1 id="classified-title">{classified.title}</h1>
        {!classified.catalogVisible && classified.isOwner ? (
          <p className="field-help" role="status">
            Este clasificado está oculto del catálogo público.
          </p>
        ) : null}
        {classified.body ? (
          <div className="classified-detail-body">{classified.body}</div>
        ) : (
          <p className="empty-state">Este clasificado no tiene descripción.</p>
        )}
        <dl className="classified-detail-facts">
          <div>
            <dt>Propietario</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(classified.owner.username)}`}>
                {classified.owner.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Publicado</dt>
            <dd>
              <time dateTime={classified.createdAt.toISOString()}>{formatDate(classified.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>
              <time dateTime={classified.updatedAt.toISOString()}>{formatDate(classified.updatedAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Actividad</dt>
            <dd>
              {classified.views} visitas · {classified.totalComments} comentarios
            </dd>
          </div>
        </dl>

        {classified.isOwner ? (
          <ClassifiedOwnerControls
            body={classified.body}
            catalogVisible={classified.catalogVisible}
            categories={categories}
            categoryId={classified.categoryId}
            classifiedId={classified.id}
            title={classified.title}
          />
        ) : null}

        <p className="classified-detail-note">
          El cuerpo se muestra como texto seguro. Fotos, comentarios, campos dinámicos, estilos y notificaciones
          requieren contratos separados.
        </p>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
