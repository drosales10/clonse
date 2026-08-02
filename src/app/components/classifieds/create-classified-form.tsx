"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ClassifiedCreateFormState } from "@domain/classifieds";
import { createClassifiedAction } from "@/app/actions/classifieds";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 5000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="classifieds-btn classifieds-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear clasificado"}
    </button>
  );
}

export function CreateClassifiedForm({
  categories,
  cancelHref = "/classifieds",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<ClassifiedCreateFormState, FormData>(createClassifiedAction, {});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form action={formAction} className="classifieds-form" noValidate>
      <div className="classifieds-field">
        <label htmlFor="classified-title">Título del clasificado</label>
        <input
          id="classified-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="classifieds-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? (
          <p className="classifieds-field-error" role="alert">
            {state.errors.title[0]}
          </p>
        ) : null}
      </div>
      <div className="classifieds-field">
        <label htmlFor="classified-body">Contenido (opcional)</label>
        <textarea
          id="classified-body"
          maxLength={BODY_MAX}
          name="body"
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          value={body}
        />
        <span className="classifieds-char-counter">{BODY_MAX - body.length} caracteres restantes</span>
        {state.errors?.body?.[0] ? (
          <p className="classifieds-field-error" role="alert">
            {state.errors.body[0]}
          </p>
        ) : null}
      </div>
      <div className="classifieds-field">
        <label htmlFor="classified-category">Categoría (opcional)</label>
        <select defaultValue="" id="classified-category" name="categoryId">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.title}` : category.title}
            </option>
          ))}
        </select>
      </div>
      {state.errors?.form?.[0] ? (
        <p className="classifieds-form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <div className="classifieds-form-actions">
        <Link className="classifieds-btn classifieds-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
