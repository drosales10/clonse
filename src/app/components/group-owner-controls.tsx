"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupManageFormState } from "@domain/groups";
import { setGroupVisibleAction, updateGroupAction } from "@/app/actions/groups";

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

export function GroupOwnerControls({
  groupId,
  title,
  description,
  categoryId,
  catalogVisible,
  categories,
}: {
  groupId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
}) {
  const [editState, editAction] = useActionState<GroupManageFormState, FormData>(updateGroupAction, {});
  const [visibleState, visibleAction] = useActionState<GroupManageFormState, FormData>(
    setGroupVisibleAction,
    {},
  );

  return (
    <section className="owner-manage-panel" aria-labelledby="group-manage-title">
      <h2 id="group-manage-title">Gestionar grupo</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="groupId" type="hidden" value={groupId} />
        <div className="field">
          <label htmlFor="edit-group-title">Título</label>
          <input
            defaultValue={title}
            id="edit-group-title"
            key={`title-${title}`}
            maxLength={120}
            name="title"
            required
            type="text"
          />
          <FieldError errors={editState.errors?.title} />
        </div>
        <div className="field">
          <label htmlFor="edit-group-description">Descripción</label>
          <textarea
            defaultValue={description ?? ""}
            id="edit-group-description"
            key={`desc-${description ?? ""}`}
            maxLength={2000}
            name="description"
            rows={5}
          />
          <FieldError errors={editState.errors?.description} />
        </div>
        <div className="field">
          <label htmlFor="edit-group-category">Categoría</label>
          <select
            defaultValue={categoryId ?? ""}
            id="edit-group-category"
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
        <input name="groupId" type="hidden" value={groupId} />
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
