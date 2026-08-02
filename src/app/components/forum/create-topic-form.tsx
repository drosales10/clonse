"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ForumTopicCreateFormState } from "@domain/forum";
import { createForumTopicAction } from "@/app/actions/forum";

const TITLE_MAX = 160;
const BODY_MAX = 8000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="forum-btn forum-btn-primary" disabled={pending} type="submit">
      {pending ? "Publicando…" : "Publicar tema"}
    </button>
  );
}

export function CreateTopicForm({
  instanceId,
  categoryId,
  cancelHref,
}: {
  instanceId: string;
  categoryId: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<ForumTopicCreateFormState, FormData>(createForumTopicAction, {});
  const [title, setTitle] = useState("");

  return (
    <form action={formAction} className="forum-form" noValidate>
      <input name="instanceId" type="hidden" value={instanceId} />
      <input name="categoryId" type="hidden" value={categoryId} />
      <div className="forum-field">
        <label htmlFor="forum-topic-title">Título</label>
        <input
          id="forum-topic-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="forum-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="forum-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="forum-field">
        <label htmlFor="forum-topic-body">Mensaje</label>
        <textarea id="forum-topic-body" maxLength={BODY_MAX} name="body" required rows={8} />
        {state.errors?.body?.[0] ? <p className="forum-field-error" role="alert">{state.errors.body[0]}</p> : null}
      </div>
      {state.errors?.form?.[0] ? <p className="forum-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="forum-form-actions">
        <Link className="forum-btn forum-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
