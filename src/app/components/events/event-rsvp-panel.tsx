"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { EVENT_RSVP, type EventRsvpFormState, type EventRsvpValue } from "@domain/events";
import { setEventRsvpAction } from "@/app/actions/events";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="events-btn events-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Confirmar asistencia"}
    </button>
  );
}

export function EventRsvpPanel({
  eventId,
  viewerRsvp,
  canRsvp,
}: {
  eventId: string;
  viewerRsvp: EventRsvpValue | null;
  canRsvp: boolean;
}) {
  const [state, formAction] = useActionState<EventRsvpFormState, FormData>(setEventRsvpAction, {});

  if (!canRsvp) return null;

  return (
    <section aria-labelledby="event-rsvp-title" className="events-rsvp-section">
      <h2 id="event-rsvp-title">Asistencia</h2>
      <form action={formAction} className="events-form">
        <input name="eventId" type="hidden" value={eventId} />
        <fieldset className="events-fieldset">
          <legend>Tu respuesta</legend>
          <label className="events-radio">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.ATTENDING}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.ATTENDING)}
            />
            <span>
              <strong>Asistiré</strong>
            </span>
          </label>
          <label className="events-radio">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.MAYBE}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.MAYBE)}
            />
            <span>
              <strong>Tal vez</strong>
            </span>
          </label>
          <label className="events-radio">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.NOT_ATTENDING}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.NOT_ATTENDING)}
            />
            <span>
              <strong>No asistiré</strong>
            </span>
          </label>
          {state.errors?.rsvp?.[0] ? (
            <p className="events-field-error" role="alert">
              {state.errors.rsvp[0]}
            </p>
          ) : null}
        </fieldset>
        {state.errors?.form?.[0] ? (
          <p className="events-form-error" role="alert">
            {state.errors.form[0]}
          </p>
        ) : null}
        {state.message ? (
          <p className="events-form-success" role="status">
            {state.message}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </section>
  );
}
