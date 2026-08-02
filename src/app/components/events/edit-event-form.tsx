"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { toDatetimeLocalValue, type EventManageFormState } from "@domain/events";
import { setEventVisibleAction, updateEventAction } from "@/app/actions/events";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="events-btn events-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditEventForm({
  eventId,
  title: initialTitle,
  description: initialDescription,
  host,
  location,
  startsAt,
  endsAt,
  categoryId,
  catalogVisible,
  categories,
  cancelHref,
}: {
  eventId: string;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");

  const [editState, editAction] = useActionState<EventManageFormState, FormData>(updateEventAction, {});
  const [visibleState, visibleAction] = useActionState<EventManageFormState, FormData>(setEventVisibleAction, {});

  const startsValue = toDatetimeLocalValue(startsAt);
  const endsValue = toDatetimeLocalValue(endsAt);

  return (
    <div className="events-edit-layout">
      <form action={editAction} className="events-form">
        <input name="eventId" type="hidden" value={eventId} />
        <div className="events-field">
          <label htmlFor="edit-event-title">Título</label>
          <input
            id="edit-event-title"
            maxLength={120}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="events-field-error" role="alert">{editState.errors.title[0]}</p>
          ) : null}
        </div>
        <div className="events-field">
          <label htmlFor="edit-event-description">Descripción</label>
          <textarea
            id="edit-event-description"
            maxLength={2000}
            name="description"
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            value={description}
          />
          {editState.errors?.description?.[0] ? (
            <p className="events-field-error" role="alert">{editState.errors.description[0]}</p>
          ) : null}
        </div>
        <div className="events-field">
          <label htmlFor="edit-event-host">Host</label>
          <input defaultValue={host ?? ""} id="edit-event-host" maxLength={120} name="host" type="text" />
          {editState.errors?.host?.[0] ? (
            <p className="events-field-error" role="alert">{editState.errors.host[0]}</p>
          ) : null}
        </div>
        <div className="events-field">
          <label htmlFor="edit-event-location">Ubicación</label>
          <input defaultValue={location ?? ""} id="edit-event-location" maxLength={200} name="location" type="text" />
          {editState.errors?.location?.[0] ? (
            <p className="events-field-error" role="alert">{editState.errors.location[0]}</p>
          ) : null}
        </div>
        <div className="events-field-row">
          <div className="events-field">
            <label htmlFor="edit-event-starts">Inicio</label>
            <input defaultValue={startsValue} id="edit-event-starts" name="startsAt" type="datetime-local" />
            {editState.errors?.startsAt?.[0] ? (
              <p className="events-field-error" role="alert">{editState.errors.startsAt[0]}</p>
            ) : null}
          </div>
          <div className="events-field">
            <label htmlFor="edit-event-ends">Fin</label>
            <input defaultValue={endsValue} id="edit-event-ends" name="endsAt" type="datetime-local" />
            {editState.errors?.endsAt?.[0] ? (
              <p className="events-field-error" role="alert">{editState.errors.endsAt[0]}</p>
            ) : null}
          </div>
        </div>
        <div className="events-field">
          <label htmlFor="edit-event-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-event-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? <p className="events-form-success" role="status">{editState.message}</p> : null}
        {editState.errors?.form?.[0] ? (
          <p className="events-form-error" role="alert">{editState.errors.form[0]}</p>
        ) : null}
        <div className="events-form-actions">
          <Link className="events-btn events-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="events-form events-form-inline">
        <input name="eventId" type="hidden" value={eventId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="events-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculto del catálogo"}.
        </p>
        <button className="events-btn events-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? <p className="events-form-success" role="status">{visibleState.message}</p> : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="events-form-error" role="alert">{visibleState.errors.form[0]}</p>
        ) : null}
      </form>
    </div>
  );
}
