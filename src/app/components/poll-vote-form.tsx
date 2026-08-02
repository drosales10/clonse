"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { PollVoteFormState, PublicPollDetail } from "@domain/polls";
import { votePollAction } from "@/app/actions/polls";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={disabled || pending} type="submit">
      {pending ? "Enviando…" : "Votar"}
    </button>
  );
}

export function PollVoteForm({ poll }: { poll: PublicPollDetail }) {
  const [state, formAction] = useActionState<PollVoteFormState, FormData>(votePollAction, {});

  if (poll.closed) {
    return <p className="empty-state">Esta encuesta está cerrada.</p>;
  }

  if (poll.viewerHasVoted) {
    return (
      <p className="success-message" role="status">
        Ya votaste
        {poll.viewerOptionIndex !== null && poll.options[poll.viewerOptionIndex]
          ? `: ${poll.options[poll.viewerOptionIndex].label}`
          : "."}
      </p>
    );
  }

  if (!poll.canVote) {
    return (
      <p className="empty-state">
        Inicia sesión para participar en esta encuesta.
      </p>
    );
  }

  return (
    <form action={formAction} className="poll-vote-form">
      <input name="pollId" type="hidden" value={poll.id} />
      <fieldset>
        <legend>Elige una opción</legend>
        <div className="poll-option-list">
          {poll.options.map((option) => (
            <label className="radio-row poll-option-row" key={option.index}>
              <input name="optionIndex" required type="radio" value={String(option.index)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.errors?.option?.[0] ? (
        <p className="field-error" role="alert">
          {state.errors.option[0]}
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
      <SubmitButton disabled={false} />
    </form>
  );
}
