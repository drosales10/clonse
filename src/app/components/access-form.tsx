"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AccessFormState } from "@domain/access";
import { loginAction, registerAction } from "@/app/actions/auth";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error" role="alert">{errors[0]}</p>;
}

export function LoginForm({ returnUrl = "/home" }: { returnUrl?: string }) {
  const [state, formAction] = useActionState<AccessFormState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="auth-form">
      <input name="returnUrl" type="hidden" value={returnUrl} />
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input autoComplete="email" id="login-email" name="email" required type="email" />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="field">
        <label htmlFor="login-password">Contraseña</label>
        <input autoComplete="current-password" id="login-password" name="password" required type="password" />
        <FieldError errors={state.errors?.password} />
      </div>
      <label className="checkbox-row">
        <input name="persistent" type="checkbox" />
        Mantener la sesión iniciada
      </label>
      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
      <SubmitButton label="Iniciar sesión" pendingLabel="Comprobando…" />
      <p className="form-footnote"><Link href="/signup">Crear una cuenta</Link> · Recuperación de contraseña próximamente</p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AccessFormState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="auth-form">
      <div className="field">
        <label htmlFor="register-email">Email</label>
        <input autoComplete="email" id="register-email" name="email" required type="email" />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="field">
        <label htmlFor="register-username">Nombre de usuario</label>
        <input autoComplete="username" id="register-username" name="username" required type="text" />
        <FieldError errors={state.errors?.username} />
      </div>
      <div className="field">
        <label htmlFor="register-password">Contraseña</label>
        <input autoComplete="new-password" id="register-password" minLength={6} name="password" required type="password" />
        <span className="field-help">Mínimo 6 caracteres alfanuméricos.</span>
        <FieldError errors={state.errors?.password} />
      </div>
      <div className="field">
        <label htmlFor="register-password-confirmation">Repite la contraseña</label>
        <input autoComplete="new-password" id="register-password-confirmation" name="passwordConfirmation" required type="password" />
        <FieldError errors={state.errors?.passwordConfirmation} />
      </div>
      <label className="checkbox-row">
        <input name="termsAccepted" required type="checkbox" />
        Acepto los términos de servicio
      </label>
      <FieldError errors={state.errors?.termsAccepted} />
      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
      <SubmitButton label="Crear cuenta" pendingLabel="Creando cuenta…" />
      <p className="form-footnote">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
    </form>
  );
}
