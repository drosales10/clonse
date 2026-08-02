import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventAttendeesSection } from "@/app/components/events/event-attendees-section";
import { EventHeader } from "@/app/components/events/event-header";
import { EventInvitationPanel } from "@/app/components/events/event-invitation-panel";
import { EventOwnerInviteSection } from "@/app/components/events/event-owner-invite-section";
import { EventRsvpPanel } from "@/app/components/events/event-rsvp-panel";
import { type AttendeeFilter } from "@domain/events";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getEventAttendees, getEventDetail } from "@/server/events/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const viewer = await getCurrentUser();
  const event = await getEventDetail(viewer?.id ?? null, eventId);
  return { title: event ? `${event.title} | Eventos` : "Evento | nexo." };
}

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
  const [event, attendees] = await Promise.all([
    getEventDetail(viewer?.id ?? null, eventId),
    getEventAttendees(viewer?.id ?? null, eventId, attendeesPage, attendeesFilter),
  ]);
  if (!event || !attendees) notFound();

  const basePath = `/events/${encodeURIComponent(event.id)}`;

  return (
    <ClientShell current="explore">
      <div className="events-module">
        <article className="events-page events-detail-page">
          <EventHeader event={event} />
          {event.canAcceptInvite ? <EventInvitationPanel eventId={event.id} /> : null}
          <EventRsvpPanel canRsvp={event.canRsvp} eventId={event.id} viewerRsvp={event.viewerRsvp} />
          <EventAttendeesSection attendees={attendees} basePath={basePath} filter={attendeesFilter} />
          {event.isOwner ? <EventOwnerInviteSection eventId={event.id} /> : null}
        </article>
      </div>
    </ClientShell>
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
