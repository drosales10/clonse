"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BlogCreateFormState } from "@domain/blogs";
import { createBlogAction } from "@/app/actions/blogs";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear entrada"}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" role="alert">
      {errors[0]}
    </p>
  );
}

export function BlogCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<BlogCreateFormState, FormData>(createBlogAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <div className="field">
        <label htmlFor="blog-title">Título</label>
        <input id="blog-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="blog-body">Contenido (opcional)</label>
        <textarea id="blog-body" maxLength={10000} name="body" rows={8} />
        <FieldError errors={state.errors?.body} />
      </div>
      <div className="field">
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
      {state.errors?.form?.[0] ? (
        <p className="form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
