"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { EventRsvpFormState } from "@domain/events";
import {
  acceptEventInvitationAction,
  declineEventInvitationAction,
} from "@/app/actions/events";

function ActionButton({ label, quiet = false }: { label: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "button button-quiet button-small" : "button button-primary button-small"}
      disabled={pending}
      type="submit"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function EventInvitationActions({ eventId }: { eventId: string }) {
  const [acceptState, acceptAction] = useActionState<EventRsvpFormState, FormData>(
    acceptEventInvitationAction,
    {},
  );
  const [declineState, declineAction] = useActionState<EventRsvpFormState, FormData>(
    declineEventInvitationAction,
    {},
  );

  return (
    <div className="relationship-actions">
      <span className="relationship-status">Tienes una invitación a este evento</span>
      <div className="relationship-button-row">
        <form action={acceptAction}>
          <input name="eventId" type="hidden" value={eventId} />
          <ActionButton label="Aceptar invitación" />
        </form>
        <form action={declineAction}>
          <input name="eventId" type="hidden" value={eventId} />
          <ActionButton label="Rechazar" quiet />
        </form>
      </div>
      {acceptState.message || declineState.message ? (
        <p className="form-success relationship-feedback" role="status">
          {acceptState.message ?? declineState.message}
        </p>
      ) : null}
      {acceptState.errors?.form?.[0] || declineState.errors?.form?.[0] ? (
        <p className="form-error relationship-feedback" role="alert">
          {acceptState.errors?.form?.[0] ?? declineState.errors?.form?.[0]}
        </p>
      ) : null}
    </div>
  );
}
