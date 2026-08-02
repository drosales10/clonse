"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { EventCreateFormState } from "@domain/events";
import { createEventAction } from "@/app/actions/events";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const DESC_MAX = 2000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="events-btn events-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear evento"}
    </button>
  );
}

export function CreateEventForm({
  categories,
  cancelHref = "/events",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<EventCreateFormState, FormData>(createEventAction, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form action={formAction} className="events-form" noValidate>
      <div className="events-field">
        <label htmlFor="event-title">Título del evento</label>
        <input
          id="event-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="events-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="events-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="events-field">
        <label htmlFor="event-description">Descripción (opcional)</label>
        <textarea
          id="event-description"
          maxLength={DESC_MAX}
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          value={description}
        />
        <span className="events-char-counter">{DESC_MAX - description.length} caracteres restantes</span>
        {state.errors?.description?.[0] ? (
          <p className="events-field-error" role="alert">{state.errors.description[0]}</p>
        ) : null}
      </div>
      <div className="events-field">
        <label htmlFor="event-host">Host (opcional)</label>
        <input id="event-host" maxLength={120} name="host" type="text" />
        {state.errors?.host?.[0] ? <p className="events-field-error" role="alert">{state.errors.host[0]}</p> : null}
      </div>
      <div className="events-field">
        <label htmlFor="event-location">Ubicación (opcional)</label>
        <input id="event-location" maxLength={200} name="location" type="text" />
        {state.errors?.location?.[0] ? (
          <p className="events-field-error" role="alert">{state.errors.location[0]}</p>
        ) : null}
      </div>
      <div className="events-field-row">
        <div className="events-field">
          <label htmlFor="event-starts">Inicio</label>
          <input id="event-starts" name="startsAt" type="datetime-local" />
          {state.errors?.startsAt?.[0] ? (
            <p className="events-field-error" role="alert">{state.errors.startsAt[0]}</p>
          ) : null}
        </div>
        <div className="events-field">
          <label htmlFor="event-ends">Fin</label>
          <input id="event-ends" name="endsAt" type="datetime-local" />
          {state.errors?.endsAt?.[0] ? (
            <p className="events-field-error" role="alert">{state.errors.endsAt[0]}</p>
          ) : null}
        </div>
      </div>
      <div className="events-field">
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
      {state.errors?.form?.[0] ? <p className="events-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="events-form-actions">
        <Link className="events-btn events-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
