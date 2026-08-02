"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ClassifiedCreateFormState } from "@domain/classifieds";
import { createClassifiedAction } from "@/app/actions/classifieds";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear clasificado"}
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

export function ClassifiedCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<ClassifiedCreateFormState, FormData>(createClassifiedAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <div className="field">
        <label htmlFor="classified-title">Título</label>
        <input id="classified-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="classified-body">Contenido (opcional)</label>
        <textarea id="classified-body" maxLength={5000} name="body" rows={6} />
        <FieldError errors={state.errors?.body} />
      </div>
      <div className="field">
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
        <p className="form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
