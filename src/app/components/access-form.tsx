"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AccessFormState } from "@domain/access";
import {
  changePasswordAction,
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resendVerificationAction,
  resetPasswordAction,
  verifyEmailAction,
} from "@/app/actions/auth";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? pendingLabel : label}</button>;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error" role="alert">{errors[0]}</p>;
}

function FormMessage({ state }: { state: AccessFormState }) {
  if (!state.message) return null;
  return <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>{state.message}</p>;
}

function DevelopmentLink({ link }: { link?: string }) {
  if (!link) return null;
  return (
    <div className="dev-link" role="status">
      <strong>Enlace de desarrollo</strong>
      <a href={link}>Abrir enlace de prueba</a>
    </div>
  );
}

export function LoginForm({ returnUrl = "/home" }: { returnUrl?: string }) {
  const [state, formAction] = useActionState<AccessFormState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="auth-form">
      <input name="returnUrl" type="hidden" value={returnUrl} />
      <div className="field"><label htmlFor="login-email">Email</label><input autoComplete="email" id="login-email" name="email" required type="email" /><FieldError errors={state.errors?.email} /></div>
      <div className="field"><label htmlFor="login-password">Contraseña</label><input autoComplete="current-password" id="login-password" name="password" required type="password" /><FieldError errors={state.errors?.password} /></div>
      <label className="checkbox-row"><input name="persistent" type="checkbox" />Mantener la sesión iniciada</label>
      <FormMessage state={state} />
      <SubmitButton label="Iniciar sesión" pendingLabel="Comprobando…" />
      <p className="form-footnote"><Link href="/signup">Crear una cuenta</Link> · <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AccessFormState, FormData>(registerAction, {});
  return (
    <form action={formAction} className="auth-form">
      <div className="field"><label htmlFor="register-email">Email</label><input autoComplete="email" id="register-email" name="email" required type="email" /><FieldError errors={state.errors?.email} /></div>
      <div className="field"><label htmlFor="register-username">Nombre de usuario</label><input autoComplete="username" id="register-username" name="username" required type="text" /><FieldError errors={state.errors?.username} /></div>
      <div className="field"><label htmlFor="register-password">Contraseña</label><input autoComplete="new-password" id="register-password" minLength={6} name="password" required type="password" /><span className="field-help">Mínimo 6 caracteres alfanuméricos.</span><FieldError errors={state.errors?.password} /></div>
      <div className="field"><label htmlFor="register-password-confirmation">Repite la contraseña</label><input autoComplete="new-password" id="register-password-confirmation" name="passwordConfirmation" required type="password" /><FieldError errors={state.errors?.passwordConfirmation} /></div>
      <label className="checkbox-row"><input name="termsAccepted" required type="checkbox" />Acepto los términos de servicio</label>
      <FieldError errors={state.errors?.termsAccepted} />
      <FormMessage state={state} /><DevelopmentLink link={state.developmentLink} />
      <SubmitButton label="Crear cuenta" pendingLabel="Creando cuenta…" />
      <p className="form-footnote">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
    </form>
  );
}

export function ResendVerificationForm() {
  const [state, formAction] = useActionState<AccessFormState, FormData>(resendVerificationAction, {});
  return (
    <form action={formAction} className="auth-form">
      <div className="field"><label htmlFor="resend-email">Email de registro</label><input autoComplete="email" id="resend-email" name="email" required type="email" /><FieldError errors={state.errors?.email} /></div>
      <FormMessage state={state} /><DevelopmentLink link={state.developmentLink} />
      <SubmitButton label="Reenviar verificación" pendingLabel="Enviando…" />
    </form>
  );
}

export function VerifyForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AccessFormState, FormData>(verifyEmailAction, {});
  return (
    <form action={formAction} className="auth-form">
      <input name="token" type="hidden" value={token} />
      <FormMessage state={state} /><FieldError errors={state.errors?.token} />
      {!state.success ? <SubmitButton label="Verificar email" pendingLabel="Verificando…" /> : <Link className="button button-primary" href="/login">Ir a iniciar sesión</Link>}
    </form>
  );
}

export function RecoveryForm() {
  const [state, formAction] = useActionState<AccessFormState, FormData>(requestPasswordResetAction, {});
  return (
    <form action={formAction} className="auth-form">
      <div className="field"><label htmlFor="recovery-email">Email de tu cuenta</label><input autoComplete="email" id="recovery-email" name="email" required type="email" /><FieldError errors={state.errors?.email} /></div>
      <FormMessage state={state} /><DevelopmentLink link={state.developmentLink} />
      <SubmitButton label="Enviar instrucciones" pendingLabel="Preparando…" />
      <p className="form-footnote"><Link href="/login">Volver a iniciar sesión</Link></p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AccessFormState, FormData>(resetPasswordAction, {});
  return (
    <form action={formAction} className="auth-form">
      <input name="token" type="hidden" value={token} />
      <div className="field"><label htmlFor="reset-password">Nueva contraseña</label><input autoComplete="new-password" id="reset-password" minLength={6} name="password" required type="password" /><FieldError errors={state.errors?.password} /></div>
      <div className="field"><label htmlFor="reset-password-confirmation">Repite la contraseña</label><input autoComplete="new-password" id="reset-password-confirmation" name="passwordConfirmation" required type="password" /><FieldError errors={state.errors?.passwordConfirmation} /></div>
      <FormMessage state={state} /><FieldError errors={state.errors?.token} />
      {state.success ? <Link className="button button-primary" href="/login">Ir a iniciar sesión</Link> : <SubmitButton label="Restablecer contraseña" pendingLabel="Guardando…" />}
    </form>
  );
}

export function PasswordChangeForm() {
  const [state, formAction] = useActionState<AccessFormState, FormData>(changePasswordAction, {});
  return (
    <form action={formAction} className="auth-form">
      <div className="field"><label htmlFor="current-password">Contraseña actual</label><input autoComplete="current-password" id="current-password" name="currentPassword" required type="password" /><FieldError errors={state.errors?.currentPassword} /></div>
      <div className="field"><label htmlFor="new-password">Nueva contraseña</label><input autoComplete="new-password" id="new-password" minLength={6} name="password" required type="password" /><span className="field-help">Mínimo 6 caracteres alfanuméricos.</span><FieldError errors={state.errors?.password} /></div>
      <div className="field"><label htmlFor="new-password-confirmation">Repite la nueva contraseña</label><input autoComplete="new-password" id="new-password-confirmation" minLength={6} name="passwordConfirmation" required type="password" /><FieldError errors={state.errors?.passwordConfirmation} /></div>
      <FieldError errors={state.errors?.form} />
      <FormMessage state={state} />
      <SubmitButton label="Cambiar contraseña" pendingLabel="Actualizando…" />
    </form>
  );
}
