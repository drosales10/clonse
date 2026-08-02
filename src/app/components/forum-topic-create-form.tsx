"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ForumTopicCreateFormState } from "@domain/forum";
import { createForumTopicAction } from "@/app/actions/forum";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Publicando…" : "Publicar tema"}
    </button>
  );
}

export function ForumTopicCreateForm({
  instanceId,
  categoryId,
}: {
  instanceId: string;
  categoryId: string;
}) {
  const [state, formAction] = useActionState<ForumTopicCreateFormState, FormData>(createForumTopicAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <input name="instanceId" type="hidden" value={instanceId} />
      <input name="categoryId" type="hidden" value={categoryId} />
      <div className="field">
        <label htmlFor="forum-topic-title">Título</label>
        <input id="forum-topic-title" maxLength={160} name="title" required type="text" />
        {state.errors?.title?.[0] ? (
          <p className="field-error" role="alert">
            {state.errors.title[0]}
          </p>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="forum-topic-body">Mensaje</label>
        <textarea id="forum-topic-body" maxLength={8000} name="body" required rows={8} />
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
      <SubmitButton />
    </form>
  );
}
