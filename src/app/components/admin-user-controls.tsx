"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  adminSetUserEnabledAction,
  adminSetUserVerifiedAction,
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
      className={quiet ? "button button-quiet" : "button button-primary button-small"}
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

export function AdminUserControls({
  userId,
  enabled,
  verified,
}: {
  userId: string;
  enabled: boolean;
  verified: boolean;
}) {
  const [enabledState, enabledAction] = useActionState<AdminActionState, FormData>(
    adminSetUserEnabledAction,
    {},
  );
  const [verifiedState, verifiedAction] = useActionState<AdminActionState, FormData>(
    adminSetUserVerifiedAction,
    {},
  );

  return (
    <section className="admin-user-controls" aria-label="Acciones administrativas">
      <h2>Gestión</h2>
      <p className="lead">Activa o desactiva la cuenta y controla la verificación de email.</p>
      <div className="admin-action-row">
        <form action={enabledAction}>
          <input name="userId" type="hidden" value={userId} />
          <input name="enabled" type="hidden" value={enabled ? "0" : "1"} />
          <PendingButton
            label={enabled ? "Deshabilitar usuario" : "Habilitar usuario"}
            pendingLabel="Guardando…"
            quiet={enabled}
          />
        </form>
        <form action={verifiedAction}>
          <input name="userId" type="hidden" value={userId} />
          <input name="verified" type="hidden" value={verified ? "0" : "1"} />
          <PendingButton
            label={verified ? "Quitar verificación" : "Marcar verificado"}
            pendingLabel="Guardando…"
            quiet={verified}
          />
        </form>
      </div>
      <Feedback state={enabledState} />
      <Feedback state={verifiedState} />
    </section>
  );
}
