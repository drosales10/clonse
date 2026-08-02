"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  adminSetPollClosedAction,
  adminSetPollVisibleAction,
  type AdminActionState,
} from "@/app/actions/admin";

function PendingButton({
  label,
  pendingLabel,
  quiet = false,
}: {
  label: string;
  pendingLabel: string;
  quiet?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "button button-quiet button-small" : "button button-primary button-small"}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Feedback({ state }: { state: AdminActionState }) {
  if (state.message) {
    return (
      <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>
        {state.message}
      </p>
    );
  }
  if (state.errors?.form?.[0]) {
    return (
      <p className="form-error" role="alert">
        {state.errors.form[0]}
      </p>
    );
  }
  return null;
}

export function AdminPollControls({
  pollId,
  closed,
  catalogVisible,
}: {
  pollId: string;
  closed: boolean;
  catalogVisible: boolean;
}) {
  const [closedState, closedAction] = useActionState<AdminActionState, FormData>(
    adminSetPollClosedAction,
    {},
  );
  const [visibleState, visibleAction] = useActionState<AdminActionState, FormData>(
    adminSetPollVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={closedAction}>
        <input name="pollId" type="hidden" value={pollId} />
        <input name="closed" type="hidden" value={closed ? "0" : "1"} />
        <PendingButton
          label={closed ? "Reabrir" : "Cerrar"}
          pendingLabel="…"
          quiet={closed}
        />
      </form>
      <form action={visibleAction}>
        <input name="pollId" type="hidden" value={pollId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={closedState} />
      <Feedback state={visibleState} />
    </div>
  );
}
