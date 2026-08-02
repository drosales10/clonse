"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { EventRsvpFormState } from "@domain/events";
import { acceptEventInvitationAction, declineEventInvitationAction } from "@/app/actions/events";

function SubmitButton({ label, quiet = false }: { label: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "events-btn events-btn-secondary" : "events-btn events-btn-primary"}
      disabled={pending}
      type="submit"
    >
      {pending ? "…" : label}
    </button>
  );
}

function Feedback({ state }: { state: EventRsvpFormState }) {
  if (state.message) {
    return (
      <p className="events-form-success" role="status">
        {state.message}
      </p>
    );
  }
  if (state.errors?.form?.[0]) {
    return (
      <p className="events-form-error" role="alert">
        {state.errors.form[0]}
      </p>
    );
  }
  return null;
}

export function EventInvitationPanel({ eventId }: { eventId: string }) {
  const [acceptState, acceptAction] = useActionState<EventRsvpFormState, FormData>(
    acceptEventInvitationAction,
    {},
  );
  const [declineState, declineAction] = useActionState<EventRsvpFormState, FormData>(
    declineEventInvitationAction,
    {},
  );

  return (
    <section aria-labelledby="event-invite-title" className="events-invitation-section">
      <h2 id="event-invite-title">Invitación</h2>
      <p className="events-membership-status">Tienes una invitación pendiente para este evento.</p>
      <div className="events-form-actions">
        <form action={acceptAction}>
          <input name="eventId" type="hidden" value={eventId} />
          <SubmitButton label="Aceptar invitación" />
        </form>
        <form action={declineAction}>
          <input name="eventId" type="hidden" value={eventId} />
          <SubmitButton label="Rechazar" quiet />
        </form>
      </div>
      <Feedback state={acceptState} />
      <Feedback state={declineState} />
    </section>
  );
}
