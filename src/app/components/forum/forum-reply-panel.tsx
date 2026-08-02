"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ForumReplyFormState } from "@domain/forum";
import { createForumReplyAction } from "@/app/actions/forum";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="forum-btn forum-btn-primary" disabled={pending} type="submit">
      {pending ? "Enviando…" : "Publicar respuesta"}
    </button>
  );
}

export function ForumReplyPanel({
  instanceId,
  categoryId,
  topicId,
}: {
  instanceId: string;
  categoryId: string;
  topicId: string;
}) {
  const [state, formAction] = useActionState<ForumReplyFormState, FormData>(createForumReplyAction, {});

  return (
    <section aria-labelledby="forum-reply-title" className="forum-reply-section">
      <h2 id="forum-reply-title">Responder</h2>
      <form action={formAction} className="forum-form">
        <input name="instanceId" type="hidden" value={instanceId} />
        <input name="categoryId" type="hidden" value={categoryId} />
        <input name="topicId" type="hidden" value={topicId} />
        <div className="forum-field">
          <label htmlFor="forum-reply-body">Tu respuesta</label>
          <textarea id="forum-reply-body" maxLength={8000} name="body" required rows={5} />
          {state.errors?.body?.[0] ? <p className="forum-field-error" role="alert">{state.errors.body[0]}</p> : null}
        </div>
        {state.errors?.form?.[0] ? <p className="forum-form-error" role="alert">{state.errors.form[0]}</p> : null}
        {state.message ? <p className="forum-form-success" role="status">{state.message}</p> : null}
        <SubmitButton />
      </form>
    </section>
  );
}
