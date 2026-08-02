"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { PollManageFormState } from "@domain/polls";
import { closeOwnPollAction } from "@/app/actions/polls";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-quiet" disabled={pending} type="submit">
      {pending ? "Cerrando…" : "Cerrar encuesta"}
    </button>
  );
}

export function PollOwnerControls({ pollId, closed }: { pollId: string; closed: boolean }) {
  const [state, formAction] = useActionState<PollManageFormState, FormData>(closeOwnPollAction, {});

  if (closed) {
    return (
      <p className="field-help" role="status">
        Esta encuesta está cerrada. Ya no acepta votos.
      </p>
    );
  }

  return (
    <section className="poll-owner-controls" aria-label="Gestión de tu encuesta">
      <form action={formAction}>
        <input name="pollId" type="hidden" value={pollId} />
        <SubmitButton />
      </form>
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
    </section>
  );
}
