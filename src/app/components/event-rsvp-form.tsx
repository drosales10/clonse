"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { EVENT_RSVP, type EventRsvpFormState, type EventRsvpValue } from "@domain/events";
import { setEventRsvpAction } from "@/app/actions/events";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary button-small" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Confirmar asistencia"}
    </button>
  );
}

export function EventRsvpForm({
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
    <section className="event-rsvp-panel" aria-label="Confirmar asistencia">
      <h2>Asistencia</h2>
      <form action={formAction} className="settings-form catalog-write-form">
        <input name="eventId" type="hidden" value={eventId} />
        <fieldset className="field">
          <legend>Tu respuesta</legend>
          <label className="radio-option">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.ATTENDING}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.ATTENDING)}
            />
            Asistiré
          </label>
          <label className="radio-option">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.MAYBE}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.MAYBE)}
            />
            Tal vez
          </label>
          <label className="radio-option">
            <input
              defaultChecked={viewerRsvp === EVENT_RSVP.NOT_ATTENDING}
              name="rsvp"
              type="radio"
              value={String(EVENT_RSVP.NOT_ATTENDING)}
            />
            No asistiré
          </label>
          {state.errors?.rsvp?.[0] ? (
            <p className="field-error" role="alert">
              {state.errors.rsvp[0]}
            </p>
          ) : null}
        </fieldset>
        {state.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {state.errors.form[0]}
          </p>
        ) : null}
        {state.message ? (
          <p className="form-success" role="status">
            {state.message}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </section>
  );
}
