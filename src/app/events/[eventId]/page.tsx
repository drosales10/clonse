import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getEventDetail } from "@/server/events/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Evento | Red Social",
  description: "Consulta un evento visible de la comunidad.",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const viewer = await getCurrentUser();
  const event = await getEventDetail(viewer?.id ?? null, eventId);
  if (!event) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel event-detail-panel" aria-labelledby="event-title">
        <Link className="text-link event-back-link" href="/events">← Volver a eventos</Link>
        <div className="event-detail-heading">
          <div>
            <p className="eyebrow">{event.category?.title ?? "Evento"}</p>
            <h1 id="event-title">{event.title}</h1>
          </div>
          {event.inviteOnly ? <span className="event-badge">Solo invitados</span> : null}
        </div>

        {event.description ? <p className="event-detail-description">{event.description}</p> : null}
        <dl className="event-detail-facts">
          <div><dt>Organiza</dt><dd><Link href={`/profile/${encodeURIComponent(event.owner.username)}`}>{event.owner.displayName}</Link></dd></div>
          {event.startsAt ? <div><dt>Inicio</dt><dd><time dateTime={event.startsAt.toISOString()}>{formatDate(event.startsAt)}</time></dd></div> : null}
          {event.endsAt ? <div><dt>Fin</dt><dd><time dateTime={event.endsAt.toISOString()}>{formatDate(event.endsAt)}</time></dd></div> : null}
          {event.location ? <div><dt>Ubicación</dt><dd>{event.location}</dd></div> : null}
          {event.host ? <div><dt>Host</dt><dd>{event.host}</dd></div> : null}
          <div><dt>Visitas</dt><dd>{event.views}</dd></div>
        </dl>
        <p className="event-detail-note">La descripción se muestra como texto seguro. Miembros, RSVP, fotos, comentarios, campos dinámicos y acciones de invitación requieren contratos separados.</p>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
