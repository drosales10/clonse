"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminLoginFormState } from "@domain/admin-access";
import { adminLoginAction } from "@/app/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? "Comprobando…" : "Entrar en administración"}</button>;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="field-error" role="alert">{errors[0]}</p> : null;
}

export function AdminLoginForm() {
  const [state, formAction] = useActionState<AdminLoginFormState, FormData>(adminLoginAction, {});
  return (
    <form action={formAction} className="auth-form">
      <div className="field"><label htmlFor="admin-username">Usuario administrativo</label><input autoComplete="username" id="admin-username" name="username" required type="text" /><FieldError errors={state.errors?.username} /></div>
      <div className="field"><label htmlFor="admin-password">Contraseña</label><input autoComplete="current-password" id="admin-password" name="password" required type="password" /><FieldError errors={state.errors?.password} /></div>
      <label className="checkbox-row"><input name="persistent" type="checkbox" />Mantener la sesión administrativa</label>
      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
      <SubmitButton />
    </form>
  );
}
