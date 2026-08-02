import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventOwnerControls } from "@/app/components/event-owner-controls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getEventDetail, listActiveEventCategories } from "@/server/events/service";

export const metadata: Metadata = {
  title: "Evento | nexo.",
  description: "Consulta un evento visible de la comunidad.",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const viewer = await getCurrentUser();
  const [event, categories] = await Promise.all([
    getEventDetail(viewer?.id ?? null, eventId),
    listActiveEventCategories(),
  ]);
  if (!event) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel event-detail-panel" aria-labelledby="event-title">
        <Link className="text-link event-back-link" href="/events">
          ← Volver a eventos
        </Link>
        <div className="event-detail-heading">
          <div>
            <p className="eyebrow">{event.category?.title ?? "Evento"}</p>
            <h1 id="event-title">{event.title}</h1>
          </div>
          {event.inviteOnly ? <span className="event-badge">Solo invitados</span> : null}
        </div>
        {!event.catalogVisible && event.isOwner ? (
          <p className="field-help" role="status">
            Este evento está oculto del catálogo público.
          </p>
        ) : null}

        {event.description ? <p className="event-detail-description">{event.description}</p> : null}
        <dl className="event-detail-facts">
          <div>
            <dt>Organiza</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(event.owner.username)}`}>
                {event.owner.displayName}
              </Link>
            </dd>
          </div>
          {event.startsAt ? (
            <div>
              <dt>Inicio</dt>
              <dd>
                <time dateTime={event.startsAt.toISOString()}>{formatDate(event.startsAt)}</time>
              </dd>
            </div>
          ) : null}
          {event.endsAt ? (
            <div>
              <dt>Fin</dt>
              <dd>
                <time dateTime={event.endsAt.toISOString()}>{formatDate(event.endsAt)}</time>
              </dd>
            </div>
          ) : null}
          {event.location ? (
            <div>
              <dt>Ubicación</dt>
              <dd>{event.location}</dd>
            </div>
          ) : null}
          {event.host ? (
            <div>
              <dt>Host</dt>
              <dd>{event.host}</dd>
            </div>
          ) : null}
          <div>
            <dt>Visitas</dt>
            <dd>{event.views}</dd>
          </div>
        </dl>

        {event.isOwner ? (
          <EventOwnerControls
            catalogVisible={event.catalogVisible}
            categories={categories}
            categoryId={event.categoryId}
            description={event.description}
            endsAt={event.endsAt}
            eventId={event.id}
            host={event.host}
            location={event.location}
            startsAt={event.startsAt}
            title={event.title}
          />
        ) : null}

        <p className="event-detail-note">
          RSVP, miembros e invitaciones quedan fuera de este corte.
        </p>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
