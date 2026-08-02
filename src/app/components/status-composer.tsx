"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateStatusAction, type StatusComposerFormState } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Publicando…" : "Publicar estado"}
    </button>
  );
}

export function StatusComposer({ currentStatus }: { currentStatus: string | null }) {
  const [state, formAction] = useActionState<StatusComposerFormState, FormData>(updateStatusAction, {});

  return (
    <section className="status-composer" aria-labelledby="status-composer-title">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">Tu voz</p>
          <h2 id="status-composer-title">¿Qué está pasando?</h2>
        </div>
      </div>
      <form action={formAction} className="status-composer-form">
        <label className="sr-only" htmlFor="home-status">
          Estado
        </label>
        <textarea
          defaultValue={currentStatus ?? ""}
          id="home-status"
          key={currentStatus ?? ""}
          maxLength={100}
          name="status"
          placeholder="Escribe un estado breve (máx. 100 caracteres)…"
          rows={3}
        />
        <div className="status-composer-actions">
          <span className="field-help">Vacío = eliminar estado actual</span>
          <SubmitButton />
        </div>
        {state.errors?.status?.[0] ? (
          <p className="field-error" role="alert">
            {state.errors.status[0]}
          </p>
        ) : null}
        {state.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {state.errors.form[0]}
          </p>
        ) : null}
        {state.message ? (
          <p className="form-success" role="status">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
