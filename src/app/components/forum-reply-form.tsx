"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ForumReplyFormState } from "@domain/forum";
import { createForumReplyAction } from "@/app/actions/forum";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Enviando…" : "Publicar respuesta"}
    </button>
  );
}

export function ForumReplyForm({
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
    <section className="forum-reply-panel" aria-label="Responder al tema">
      <h2>Responder</h2>
      <form action={formAction} className="settings-form catalog-write-form">
        <input name="instanceId" type="hidden" value={instanceId} />
        <input name="categoryId" type="hidden" value={categoryId} />
        <input name="topicId" type="hidden" value={topicId} />
        <div className="field">
          <label htmlFor="forum-reply-body">Tu respuesta</label>
          <textarea id="forum-reply-body" maxLength={8000} name="body" required rows={5} />
          {state.errors?.body?.[0] ? (
            <p className="field-error" role="alert">
              {state.errors.body[0]}
            </p>
          ) : null}
        </div>
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
        <SubmitButton />
      </form>
    </section>
  );
}
