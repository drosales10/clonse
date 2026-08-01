import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedDetail } from "@/server/classifieds/service";

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
  const classified = await getClassifiedDetail(viewer?.id ?? null, classifiedId);
  if (!classified) notFound();

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación principal">
          <Link className="text-link" href="/classifieds">Clasificados</Link>
          {viewer ? <Link className="text-link" href={`/profile/${encodeURIComponent(viewer.username)}`}>Mi perfil</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}
        </nav>
      </header>

      <article className="profile-panel classified-detail-panel" aria-labelledby="classified-title">
        <Link className="text-link classified-back-link" href="/classifieds">← Volver a clasificados</Link>
        <p className="eyebrow">{classified.category?.title ?? "Clasificado"}</p>
        <h1 id="classified-title">{classified.title}</h1>
        {classified.body ? <div className="classified-detail-body">{classified.body}</div> : <p className="empty-state">Este clasificado no tiene descripción.</p>}
        <dl className="classified-detail-facts">
          <div><dt>Propietario</dt><dd><Link href={`/profile/${encodeURIComponent(classified.owner.username)}`}>{classified.owner.displayName}</Link></dd></div>
          <div><dt>Publicado</dt><dd><time dateTime={classified.createdAt.toISOString()}>{formatDate(classified.createdAt)}</time></dd></div>
          <div><dt>Actualizado</dt><dd><time dateTime={classified.updatedAt.toISOString()}>{formatDate(classified.updatedAt)}</time></dd></div>
          <div><dt>Actividad</dt><dd>{classified.views} visitas · {classified.totalComments} comentarios</dd></div>
        </dl>
        <p className="classified-detail-note">El cuerpo se muestra como texto seguro. Fotos, comentarios, campos dinámicos, estilos y notificaciones requieren contratos separados.</p>
      </article>
    </main>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
