"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BlogCreateFormState } from "@domain/blogs";
import { createBlogAction } from "@/app/actions/blogs";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 10000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="blogs-btn blogs-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear entrada"}
    </button>
  );
}

export function CreateBlogForm({
  categories,
  cancelHref = "/blogs",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<BlogCreateFormState, FormData>(createBlogAction, {});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form action={formAction} className="blogs-form" noValidate>
      <div className="blogs-field">
        <label htmlFor="blog-title">Título</label>
        <input
          id="blog-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="blogs-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="blogs-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="blogs-field">
        <label htmlFor="blog-body">Contenido (opcional)</label>
        <textarea
          id="blog-body"
          maxLength={BODY_MAX}
          name="body"
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          value={body}
        />
        <span className="blogs-char-counter">{BODY_MAX - body.length} caracteres restantes</span>
        {state.errors?.body?.[0] ? <p className="blogs-field-error" role="alert">{state.errors.body[0]}</p> : null}
      </div>
      <div className="blogs-field">
        <label htmlFor="blog-category">Categoría (opcional)</label>
        <select defaultValue="" id="blog-category" name="categoryId">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.title}` : category.title}
            </option>
          ))}
        </select>
      </div>
      {state.errors?.form?.[0] ? <p className="blogs-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="blogs-form-actions">
        <Link className="blogs-btn blogs-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
