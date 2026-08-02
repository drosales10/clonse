"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AlbumCreateFormState } from "@domain/albums";
import { createAlbumAction } from "@/app/actions/albums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear álbum"}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" role="alert">
      {errors[0]}
    </p>
  );
}

export function AlbumCreateForm() {
  const [state, formAction] = useActionState<AlbumCreateFormState, FormData>(createAlbumAction, {});

  return (
    <form action={formAction} className="settings-form album-create-form">
      <div className="field">
        <label htmlFor="album-title">Título</label>
        <input id="album-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="album-description">Descripción (opcional)</label>
        <textarea id="album-description" maxLength={1000} name="description" rows={4} />
        <FieldError errors={state.errors?.description} />
      </div>
      {state.errors?.form?.[0] ? (
        <p className="form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
