import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EVENT_RSVP, type AttendeeFilter } from "@domain/events";
import { EventInvitationActions } from "@/app/components/event-invitation-actions";
import { EventOwnerControls } from "@/app/components/event-owner-controls";
import { EventOwnerInvitePanel } from "@/app/components/event-owner-invite-panel";
import { EventRsvpForm } from "@/app/components/event-rsvp-form";
import { AttendeeListPagination } from "@/app/components/member-list-pagination";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import {
  getEventAttendees,
  getEventDetail,
  listActiveEventCategories,
} from "@/server/events/service";

export const metadata: Metadata = {
  title: "Evento | nexo.",
  description: "Consulta un evento visible de la comunidad.",
};

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const query = await searchParams;
  const attendeesPage = readPage(query.attendeesPage);
  const attendeesFilter = readFilter(query.attendeesFilter);
  const viewer = await getCurrentUser();
  const [event, categories, attendees] = await Promise.all([
    getEventDetail(viewer?.id ?? null, eventId),
    listActiveEventCategories(),
    getEventAttendees(viewer?.id ?? null, eventId, attendeesPage, attendeesFilter),
  ]);
  if (!event || !attendees) notFound();

  const basePath = `/events/${encodeURIComponent(event.id)}`;

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
        </dl>

        {event.canAcceptInvite ? <EventInvitationActions eventId={event.id} /> : null}
        <EventRsvpForm canRsvp={event.canRsvp} eventId={event.id} viewerRsvp={event.viewerRsvp} />

        <section className="member-list-panel" aria-labelledby="event-attendees-title">
          <div className="member-list-heading">
            <h2 id="event-attendees-title">Asistentes</h2>
            <nav aria-label="Filtrar asistentes" className="attendee-filter-bar">
              <FilterLink active={attendeesFilter === "all"} basePath={basePath} filter="all" label="Todos" />
              <FilterLink active={attendeesFilter === "attending"} basePath={basePath} filter="attending" label="Asistirán" />
              <FilterLink active={attendeesFilter === "maybe"} basePath={basePath} filter="maybe" label="Tal vez" />
            </nav>
          </div>
          {attendees.items.length > 0 ? (
            <ul className="member-list">
              {attendees.items.map((attendee) => (
                <li key={attendee.user.username}>
                  <Link href={`/profile/${encodeURIComponent(attendee.user.username)}`}>
                    {attendee.user.displayName}
                  </Link>
                  <span className="member-list-meta">
                    @{attendee.user.username} · {rsvpLabel(attendee.rsvp)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No hay asistentes en este filtro.</p>
          )}
          <AttendeeListPagination
            ariaLabel="Paginación de asistentes"
            basePath={basePath}
            filter={attendeesFilter}
            page={attendees.pagination.page}
            pageCount={attendees.pagination.pageCount}
          />
        </section>

        {event.isOwner ? (
          <>
            <EventOwnerInvitePanel eventId={event.id} />
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
          </>
        ) : null}
      </article>
    </ClientShell>
  );
}

function FilterLink({
  basePath,
  filter,
  label,
  active,
}: {
  basePath: string;
  filter: AttendeeFilter;
  label: string;
  active: boolean;
}) {
  const href =
    filter === "all"
      ? basePath
      : `${basePath}?${new URLSearchParams({ attendeesFilter: filter }).toString()}`;
  return (
    <Link aria-current={active ? "page" : undefined} className="text-link" href={href}>
      {label}
    </Link>
  );
}

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readFilter(value: string | string[] | undefined): AttendeeFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "attending" || raw === "maybe" ? raw : "all";
}

function rsvpLabel(rsvp: number): string {
  if (rsvp === EVENT_RSVP.ATTENDING) return "Asistirá";
  if (rsvp === EVENT_RSVP.MAYBE) return "Tal vez";
  return "No asistirá";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
