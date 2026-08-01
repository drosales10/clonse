"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ProfileSettingsFormState } from "@domain/profile";
import { updateProfileSettingsAction } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar ajustes"}</button>;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error" role="alert">{errors[0]}</p>;
}

function FormMessage({ state }: { state: ProfileSettingsFormState }) {
  if (!state.message) return null;
  return <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>{state.message}</p>;
}

export function ProfileSettingsForm({
  profilePrivacy,
  commentsPrivacy,
  status,
  username,
}: {
  profilePrivacy: number;
  commentsPrivacy: number;
  status: string | null;
  username: string;
}) {
  const [state, formAction] = useActionState<ProfileSettingsFormState, FormData>(updateProfileSettingsAction, {});

  return (
    <form action={formAction} className="settings-form">
      <div className="field">
        <label htmlFor="profile-privacy">Quién puede ver tu perfil</label>
        <select defaultValue={String(profilePrivacy)} id="profile-privacy" name="profilePrivacy">
          <option value="0">Nadie salvo tú</option>
          <option value="1">Solo tú</option>
          <option value="3">Tus conexiones</option>
          <option value="7">Conexiones ampliadas</option>
          <option value="15">Tu red de conexiones</option>
          <option value="31">Usuarios registrados</option>
          <option value="63">Todo el mundo</option>
        </select>
        <span className="field-help">Se conserva la máscara de privacidad del sistema legacy.</span>
        <FieldError errors={state.errors?.profilePrivacy} />
      </div>
      <div className="field">
        <label htmlFor="comments-privacy">Quién puede comentar en tu perfil</label>
        <select defaultValue={String(commentsPrivacy)} id="comments-privacy" name="commentsPrivacy">
          <option value="0">Nadie salvo tú</option>
          <option value="1">Solo tú</option>
          <option value="3">Tus conexiones</option>
          <option value="7">Conexiones ampliadas</option>
          <option value="15">Tu red de conexiones</option>
          <option value="31">Usuarios registrados</option>
          <option value="63">Todo el mundo</option>
        </select>
        <span className="field-help">Esta regla se aplica aparte de la visibilidad general del perfil.</span>
        <FieldError errors={state.errors?.commentsPrivacy} />
      </div>
      <div className="field">
        <label htmlFor="profile-status">Estado</label>
        <textarea defaultValue={status ?? ""} id="profile-status" maxLength={100} name="status" rows={4} />
        <span className="field-help">Máximo 100 caracteres. Déjalo vacío para quitarlo.</span>
        <FieldError errors={state.errors?.status} />
      </div>
      <FieldError errors={state.errors?.form} />
      <FormMessage state={state} />
      <SubmitButton />
      <p className="form-footnote"><Link href={`/profile/${encodeURIComponent(username)}`}>Ver mi perfil</Link> · <Link href="/home">Volver al inicio</Link></p>
    </form>
  );
}
