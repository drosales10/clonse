"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupCreateFormState } from "@domain/groups";
import { createGroupAction } from "@/app/actions/groups";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear grupo"}
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

export function GroupCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<GroupCreateFormState, FormData>(createGroupAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <div className="field">
        <label htmlFor="group-title">Título</label>
        <input id="group-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="group-description">Descripción (opcional)</label>
        <textarea id="group-description" maxLength={2000} name="description" rows={5} />
        <FieldError errors={state.errors?.description} />
      </div>
      <div className="field">
        <label htmlFor="group-category">Categoría (opcional)</label>
        <select defaultValue="" id="group-category" name="categoryId">
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
