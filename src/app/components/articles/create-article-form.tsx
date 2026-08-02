"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ArticleCreateFormState } from "@domain/articles";
import { createArticleAction } from "@/app/actions/articles";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 10000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="articles-btn articles-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear artículo"}
    </button>
  );
}

export function CreateArticleForm({
  categories,
  cancelHref = "/articles",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<ArticleCreateFormState, FormData>(createArticleAction, {});
  const [title, setTitle] = useState("");

  return (
    <form action={formAction} className="articles-form" noValidate>
      <div className="articles-field">
        <label htmlFor="article-title">Título del artículo</label>
        <input
          id="article-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="articles-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="articles-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="articles-field">
        <label htmlFor="article-body">Contenido (opcional)</label>
        <textarea id="article-body" maxLength={BODY_MAX} name="body" rows={10} />
        {state.errors?.body?.[0] ? <p className="articles-field-error" role="alert">{state.errors.body[0]}</p> : null}
      </div>
      <div className="articles-field">
        <label htmlFor="article-category">Categoría (opcional)</label>
        <select defaultValue="" id="article-category" name="categoryId">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.title}` : category.title}
            </option>
          ))}
        </select>
      </div>
      {state.errors?.form?.[0] ? <p className="articles-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="articles-form-actions">
        <Link className="articles-btn articles-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
