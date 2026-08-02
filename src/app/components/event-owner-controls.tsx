"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { toDatetimeLocalValue, type EventManageFormState } from "@domain/events";
import { setEventVisibleAction, updateEventAction } from "@/app/actions/events";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function VisibilityButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-quiet" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
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

export function EventOwnerControls({
  eventId,
  title,
  description,
  host,
  location,
  startsAt,
  endsAt,
  categoryId,
  catalogVisible,
  categories,
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
}) {
  const [editState, editAction] = useActionState<EventManageFormState, FormData>(updateEventAction, {});
  const [visibleState, visibleAction] = useActionState<EventManageFormState, FormData>(
    setEventVisibleAction,
    {},
  );

  const startsValue = toDatetimeLocalValue(startsAt);
  const endsValue = toDatetimeLocalValue(endsAt);

  return (
    <section className="owner-manage-panel" aria-labelledby="event-manage-title">
      <h2 id="event-manage-title">Gestionar evento</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="eventId" type="hidden" value={eventId} />
        <div className="field">
          <label htmlFor="edit-event-title">Título</label>
          <input
            defaultValue={title}
            id="edit-event-title"
            key={`title-${title}`}
            maxLength={120}
            name="title"
            required
            type="text"
          />
          <FieldError errors={editState.errors?.title} />
        </div>
        <div className="field">
          <label htmlFor="edit-event-description">Descripción</label>
          <textarea
            defaultValue={description ?? ""}
            id="edit-event-description"
            key={`desc-${description ?? ""}`}
            maxLength={2000}
            name="description"
            rows={4}
          />
          <FieldError errors={editState.errors?.description} />
        </div>
        <div className="field">
          <label htmlFor="edit-event-host">Host</label>
          <input
            defaultValue={host ?? ""}
            id="edit-event-host"
            key={`host-${host ?? ""}`}
            maxLength={120}
            name="host"
            type="text"
          />
          <FieldError errors={editState.errors?.host} />
        </div>
        <div className="field">
          <label htmlFor="edit-event-location">Ubicación</label>
          <input
            defaultValue={location ?? ""}
            id="edit-event-location"
            key={`loc-${location ?? ""}`}
            maxLength={200}
            name="location"
            type="text"
          />
          <FieldError errors={editState.errors?.location} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="edit-event-starts">Inicio</label>
            <input
              defaultValue={startsValue}
              id="edit-event-starts"
              key={`start-${startsValue}`}
              name="startsAt"
              type="datetime-local"
            />
            <FieldError errors={editState.errors?.startsAt} />
          </div>
          <div className="field">
            <label htmlFor="edit-event-ends">Fin</label>
            <input
              defaultValue={endsValue}
              id="edit-event-ends"
              key={`end-${endsValue}`}
              name="endsAt"
              type="datetime-local"
            />
            <FieldError errors={editState.errors?.endsAt} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="edit-event-category">Categoría</label>
          <select
            defaultValue={categoryId ?? ""}
            id="edit-event-category"
            key={`cat-${categoryId ?? ""}`}
            name="categoryId"
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {editState.errors.form[0]}
          </p>
        ) : null}
        {editState.message ? (
          <p className="form-success" role="status">
            {editState.message}
          </p>
        ) : null}
        <SaveButton />
      </form>

      <form action={visibleAction} className="owner-visibility-form">
        <input name="eventId" type="hidden" value={eventId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <VisibilityButton
          label={catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
          pendingLabel="Actualizando…"
        />
        {visibleState.message ? (
          <p className="form-success" role="status">
            {visibleState.message}
          </p>
        ) : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {visibleState.errors.form[0]}
          </p>
        ) : null}
      </form>
    </section>
  );
}
