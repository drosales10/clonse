import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getGroupDetail } from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Grupo | Red Social",
  description: "Consulta un grupo visible de la comunidad.",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const viewer = await getCurrentUser();
  const group = await getGroupDetail(viewer?.id ?? null, groupId);
  if (!group) notFound();

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación principal">
          <Link className="text-link" href="/groups">Grupos</Link>
          {viewer ? <Link className="text-link" href={`/profile/${encodeURIComponent(viewer.username)}`}>Mi perfil</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}
        </nav>
      </header>

      <article className="profile-panel group-detail-panel" aria-labelledby="group-title">
        <Link className="text-link group-back-link" href="/groups">← Volver a grupos</Link>
        <p className="eyebrow">{group.category?.title ?? "Grupo"}</p>
        <h1 id="group-title">{group.title}</h1>
        {group.description ? <div className="group-detail-description">{group.description}</div> : <p className="empty-state">Este grupo no tiene descripción.</p>}
        <dl className="group-detail-facts">
          <div><dt>Propietario</dt><dd><Link href={`/profile/${encodeURIComponent(group.owner.username)}`}>{group.owner.displayName}</Link></dd></div>
          <div><dt>Creado</dt><dd><time dateTime={group.createdAt.toISOString()}>{formatDate(group.createdAt)}</time></dd></div>
          <div><dt>Actualizado</dt><dd><time dateTime={group.updatedAt.toISOString()}>{formatDate(group.updatedAt)}</time></dd></div>
          <div><dt>Visitas</dt><dd>{group.views}</dd></div>
        </dl>
        <p className="group-detail-note">La descripción se muestra como texto seguro. Miembros, discusiones, fotos, comentarios, campos dinámicos, suscripciones e invitaciones requieren contratos separados.</p>
      </article>
    </main>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
