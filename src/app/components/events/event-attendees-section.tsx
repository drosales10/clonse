import Link from "next/link";

import { EVENT_RSVP, type AttendeeFilter, type PublicEventAttendeeRow } from "@domain/events";

import { AttendeeListPagination } from "@/app/components/member-list-pagination";

function rsvpLabel(rsvp: number): string {
  if (rsvp === EVENT_RSVP.ATTENDING) return "Asistirá";
  if (rsvp === EVENT_RSVP.MAYBE) return "Tal vez";
  return "No asistirá";
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
    filter === "all" ? basePath : `${basePath}?${new URLSearchParams({ attendeesFilter: filter }).toString()}`;
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={active ? "events-filter-chip events-filter-chip-active" : "events-filter-chip"}
      href={href}
    >
      {label}
    </Link>
  );
}

export function EventAttendeesSection({
  attendees,
  basePath,
  filter,
}: {
  attendees: {
    items: PublicEventAttendeeRow[];
    pagination: { page: number; pageCount: number };
  };
  basePath: string;
  filter: AttendeeFilter;
}) {
  return (
    <section aria-labelledby="event-attendees-title" className="events-attendees-section">
      <div className="events-attendees-heading">
        <h2 id="event-attendees-title">Asistentes</h2>
        <nav aria-label="Filtrar asistentes" className="events-filter-bar">
          <FilterLink active={filter === "all"} basePath={basePath} filter="all" label="Todos" />
          <FilterLink active={filter === "attending"} basePath={basePath} filter="attending" label="Asistirán" />
          <FilterLink active={filter === "maybe"} basePath={basePath} filter="maybe" label="Tal vez" />
        </nav>
      </div>
      {attendees.items.length > 0 ? (
        <ul className="events-attendee-list">
          {attendees.items.map((attendee) => (
            <li key={attendee.user.username}>
              <Link href={`/profile/${encodeURIComponent(attendee.user.username)}`}>
                {attendee.user.displayName}
              </Link>
              <span className="events-attendee-meta">
                @{attendee.user.username} · {rsvpLabel(attendee.rsvp)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="events-form-help">No hay asistentes en este filtro.</p>
      )}
      <AttendeeListPagination
        ariaLabel="Paginación de asistentes"
        basePath={basePath}
        filter={filter}
        page={attendees.pagination.page}
        pageCount={attendees.pagination.pageCount}
      />
    </section>
  );
}
