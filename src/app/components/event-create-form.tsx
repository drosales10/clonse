"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { EventCreateFormState } from "@domain/events";
import { createEventAction } from "@/app/actions/events";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear evento"}
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

export function EventCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState<EventCreateFormState, FormData>(createEventAction, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form">
      <div className="field">
        <label htmlFor="event-title">Título</label>
        <input id="event-title" maxLength={120} name="title" required type="text" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="event-description">Descripción (opcional)</label>
        <textarea id="event-description" maxLength={2000} name="description" rows={4} />
        <FieldError errors={state.errors?.description} />
      </div>
      <div className="field">
        <label htmlFor="event-host">Host (opcional)</label>
        <input id="event-host" maxLength={120} name="host" type="text" />
        <FieldError errors={state.errors?.host} />
      </div>
      <div className="field">
        <label htmlFor="event-location">Ubicación (opcional)</label>
        <input id="event-location" maxLength={200} name="location" type="text" />
        <FieldError errors={state.errors?.location} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="event-starts">Inicio</label>
          <input id="event-starts" name="startsAt" type="datetime-local" />
          <FieldError errors={state.errors?.startsAt} />
        </div>
        <div className="field">
          <label htmlFor="event-ends">Fin</label>
          <input id="event-ends" name="endsAt" type="datetime-local" />
          <FieldError errors={state.errors?.endsAt} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="event-category">Categoría (opcional)</label>
        <select defaultValue="" id="event-category" name="categoryId">
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
