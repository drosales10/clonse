import Link from "next/link";

import type { PublicEventDetail } from "@domain/events";

import { EventBreadcrumb } from "@/app/components/events/event-ui";
import { eventLocationLabel, formatEventDateTime, ownerInitials } from "@/app/components/events/utils";

export function EventHeader({ event }: { event: PublicEventDetail }) {
  return (
    <header className="events-detail-header">
      <EventBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Eventos", href: "/events" },
          { label: event.title },
        ]}
      />
      <div className="events-detail-heading">
        <div>
          <div className="events-detail-badges">
            <span className="events-category-badge">{event.category?.title ?? "Evento"}</span>
            {event.inviteOnly ? <span className="events-badge events-badge-invite">Solo invitados</span> : null}
          </div>
          <h1>{event.title}</h1>
          {event.description ? (
            <p className="events-detail-description">{event.description}</p>
          ) : (
            <p className="events-detail-description events-detail-description-muted">Sin descripción.</p>
          )}
          {!event.catalogVisible && event.isOwner ? (
            <p className="events-inline-notice" role="status">
              Este evento está oculto del catálogo público.
            </p>
          ) : null}
        </div>
        <div className="events-detail-actions">
          <Link className="events-btn events-btn-secondary" href="/events">
            Volver a Eventos
          </Link>
          {event.isOwner ? (
            <Link className="events-btn events-btn-primary" href={`/events/${encodeURIComponent(event.id)}/edit`}>
              Editar evento
            </Link>
          ) : null}
        </div>
      </div>
      <div className="events-detail-owner">
        <span aria-hidden="true" className="events-avatar events-avatar-lg">
          {ownerInitials(event.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(event.owner.username)}`}>{event.owner.displayName}</Link>
          <p>@{event.owner.username}</p>
        </div>
      </div>
      <dl className="events-detail-facts">
        {event.startsAt ? (
          <div>
            <dt>Inicio</dt>
            <dd>
              <time dateTime={event.startsAt.toISOString()}>{formatEventDateTime(event.startsAt)}</time>
            </dd>
          </div>
        ) : null}
        {event.endsAt ? (
          <div>
            <dt>Fin</dt>
            <dd>
              <time dateTime={event.endsAt.toISOString()}>{formatEventDateTime(event.endsAt)}</time>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Lugar</dt>
          <dd>{eventLocationLabel(event.location, event.host)}</dd>
        </div>
        <div>
          <dt>Asistentes</dt>
          <dd>{event.attendeeCount}</dd>
        </div>
        {event.maybeCount > 0 ? (
          <div>
            <dt>Tal vez</dt>
            <dd>{event.maybeCount}</dd>
          </div>
        ) : null}
        <div>
          <dt>Visitas</dt>
          <dd>{event.views}</dd>
        </div>
      </dl>
    </header>
  );
}
