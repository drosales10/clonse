"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { adminSetAlbumVisibleAction, type AdminActionState } from "@/app/actions/admin";

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

export function AdminAlbumControls({
  albumId,
  catalogVisible,
}: {
  albumId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetAlbumVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="albumId" type="hidden" value={albumId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      {state.message ? (
        <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
      {state.errors?.form?.[0] ? (
        <p className="form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
    </div>
  );
}
