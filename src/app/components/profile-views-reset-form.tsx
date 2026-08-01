"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ProfileViewsResetFormState } from "@/app/actions/profile-views";
import { resetProfileViewsAction } from "@/app/actions/profile-views";

function ResetButton() {
  const { pending } = useFormStatus();
  return <button className="text-button text-button-danger" disabled={pending} type="submit">{pending ? "Reiniciando…" : "Reiniciar estadísticas"}</button>;
}

export function ProfileViewsResetForm() {
  const [state, formAction] = useActionState<ProfileViewsResetFormState, FormData>(resetProfileViewsAction, {});

  return (
    <form action={formAction} className="profile-views-reset-form">
      <ResetButton />
      {state.message ? <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>{state.message}</p> : null}
    </form>
  );
}
