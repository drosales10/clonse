"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { PollCreateFormState } from "@domain/polls";
import { createPollAction } from "@/app/actions/polls";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Publicar encuesta"}
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

export function PollCreateForm() {
  const [state, formAction] = useActionState<PollCreateFormState, FormData>(createPollAction, {});

  return (
    <form action={formAction} className="settings-form poll-create-form">
      <div className="field">
        <label htmlFor="poll-title">Título</label>
        <input id="poll-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="poll-description">Descripción (opcional)</label>
        <textarea id="poll-description" maxLength={500} name="description" rows={3} />
      </div>
      <div className="field">
        <label htmlFor="poll-options">Opciones</label>
        <textarea
          id="poll-options"
          name="options"
          placeholder={"Sí\nNo\nTal vez"}
          required
          rows={6}
        />
        <span className="field-help">Una opción por línea. Mínimo 2, máximo 12.</span>
        <FieldError errors={state.errors?.options} />
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
