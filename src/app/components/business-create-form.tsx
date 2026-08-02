"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BusinessCreateFormState } from "@domain/businesses";
import { createBusinessAction } from "@/app/actions/businesses";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear negocio"}
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

export function BusinessCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<BusinessCreateFormState, FormData>(createBusinessAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <div className="field">
        <label htmlFor="business-title">Título</label>
        <input id="business-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="business-summary">Resumen (opcional)</label>
        <textarea id="business-summary" maxLength={500} name="summary" rows={3} />
        <FieldError errors={state.errors?.summary} />
      </div>
      <div className="field">
        <label htmlFor="business-description">Descripción (opcional)</label>
        <textarea id="business-description" maxLength={5000} name="description" rows={5} />
        <FieldError errors={state.errors?.description} />
      </div>
      <div className="field">
        <label htmlFor="business-city">Ciudad (opcional)</label>
        <input id="business-city" maxLength={100} name="city" type="text" />
        <FieldError errors={state.errors?.city} />
      </div>
      <div className="field">
        <label htmlFor="business-province">Provincia (opcional)</label>
        <input id="business-province" maxLength={100} name="province" type="text" />
        <FieldError errors={state.errors?.province} />
      </div>
      <div className="field">
        <label htmlFor="business-country">País (opcional)</label>
        <input id="business-country" maxLength={100} name="country" type="text" />
        <FieldError errors={state.errors?.country} />
      </div>
      <div className="field">
        <label htmlFor="business-category">Categoría (opcional)</label>
        <select defaultValue="" id="business-category" name="categoryId">
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
