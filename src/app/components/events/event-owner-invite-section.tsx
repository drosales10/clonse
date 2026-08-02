"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { EventRsvpFormState } from "@domain/events";
import { inviteEventMemberAction } from "@/app/actions/events";

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <button className="events-btn events-btn-primary" disabled={pending} type="submit">
      {pending ? "Enviando…" : "Invitar"}
    </button>
  );
}

export function EventOwnerInviteSection({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState<EventRsvpFormState, FormData>(inviteEventMemberAction, {});

  return (
    <section aria-label="Invitar asistentes" className="events-owner-panel">
      <h2>Invitar asistentes</h2>
      <form action={formAction} className="events-form">
        <input name="eventId" type="hidden" value={eventId} />
        <div className="events-field">
          <label htmlFor="invite-event-username">Usuario</label>
          <input id="invite-event-username" maxLength={64} name="username" required type="text" />
          {state.errors?.username?.[0] ? (
            <p className="events-field-error" role="alert">
              {state.errors.username[0]}
            </p>
          ) : null}
        </div>
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
        <InviteButton />
      </form>
    </section>
  );
}
