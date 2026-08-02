"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { PollVoteFormState, PublicPollDetail } from "@domain/polls";
import { votePollAction } from "@/app/actions/polls";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="polls-btn polls-btn-primary" disabled={disabled || pending} type="submit">
      {pending ? "Enviando…" : "Votar"}
    </button>
  );
}

export function PollVotePanel({ poll }: { poll: PublicPollDetail }) {
  const [state, formAction] = useActionState<PollVoteFormState, FormData>(votePollAction, {});

  if (poll.closed) {
    return (
      <section aria-labelledby="poll-vote-title" className="polls-vote-section">
        <h2 id="poll-vote-title">Tu voto</h2>
        <p className="polls-inline-notice" role="status">
          Esta encuesta está cerrada y ya no acepta votos.
        </p>
      </section>
    );
  }

  if (poll.viewerHasVoted) {
    return (
      <section aria-labelledby="poll-vote-title" className="polls-vote-section">
        <h2 id="poll-vote-title">Tu voto</h2>
        <p className="polls-form-success" role="status">
          Ya votaste
          {poll.viewerOptionIndex !== null && poll.options[poll.viewerOptionIndex]
            ? `: ${poll.options[poll.viewerOptionIndex].label}`
            : "."}
        </p>
      </section>
    );
  }

  if (!poll.canVote) {
    return (
      <section aria-labelledby="poll-vote-title" className="polls-vote-section">
        <h2 id="poll-vote-title">Tu voto</h2>
        <p className="polls-inline-notice">
          <a className="polls-text-link" href={`/login?returnUrl=/polls/${encodeURIComponent(poll.id)}`}>
            Inicia sesión
          </a>{" "}
          para participar en esta encuesta.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="poll-vote-title" className="polls-vote-section">
      <h2 id="poll-vote-title">Tu voto</h2>
      <form action={formAction} className="polls-vote-form">
        <input name="pollId" type="hidden" value={poll.id} />
        <fieldset>
          <legend>Elige una opción</legend>
          <div className="polls-option-list">
            {poll.options.map((option) => (
              <label className="polls-option-row" key={option.index}>
                <input name="optionIndex" required type="radio" value={String(option.index)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {state.errors?.option?.[0] ? (
          <p className="polls-field-error" role="alert">
            {state.errors.option[0]}
          </p>
        ) : null}
        {state.errors?.form?.[0] ? (
          <p className="polls-form-error" role="alert">
            {state.errors.form[0]}
          </p>
        ) : null}
        {state.message ? (
          <p className="polls-form-success" role="status">
            {state.message}
          </p>
        ) : null}
        <SubmitButton disabled={false} />
      </form>
    </section>
  );
}
