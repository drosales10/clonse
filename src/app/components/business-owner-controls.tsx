"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BusinessManageFormState } from "@domain/businesses";
import { setBusinessVisibleAction, updateBusinessAction } from "@/app/actions/businesses";

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

export function BusinessOwnerControls({
  businessId,
  title,
  summary,
  description,
  city,
  province,
  country,
  categoryId,
  catalogVisible,
  categories,
}: {
  businessId: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
}) {
  const [editState, editAction] = useActionState<BusinessManageFormState, FormData>(updateBusinessAction, {});
  const [visibleState, visibleAction] = useActionState<BusinessManageFormState, FormData>(
    setBusinessVisibleAction,
    {},
  );

  return (
    <section className="owner-manage-panel" aria-labelledby="business-manage-title">
      <h2 id="business-manage-title">Gestionar negocio</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="businessId" type="hidden" value={businessId} />
        <div className="field">
          <label htmlFor="edit-business-title">Título</label>
          <input
            defaultValue={title}
            id="edit-business-title"
            key={`title-${title}`}
            maxLength={120}
            name="title"
            required
            type="text"
          />
          <FieldError errors={editState.errors?.title} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-summary">Resumen</label>
          <textarea
            defaultValue={summary ?? ""}
            id="edit-business-summary"
            key={`summary-${summary ?? ""}`}
            maxLength={500}
            name="summary"
            rows={3}
          />
          <FieldError errors={editState.errors?.summary} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-description">Descripción</label>
          <textarea
            defaultValue={description ?? ""}
            id="edit-business-description"
            key={`desc-${description ?? ""}`}
            maxLength={5000}
            name="description"
            rows={5}
          />
          <FieldError errors={editState.errors?.description} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-city">Ciudad</label>
          <input
            defaultValue={city ?? ""}
            id="edit-business-city"
            key={`city-${city ?? ""}`}
            maxLength={100}
            name="city"
            type="text"
          />
          <FieldError errors={editState.errors?.city} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-province">Provincia</label>
          <input
            defaultValue={province ?? ""}
            id="edit-business-province"
            key={`province-${province ?? ""}`}
            maxLength={100}
            name="province"
            type="text"
          />
          <FieldError errors={editState.errors?.province} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-country">País</label>
          <input
            defaultValue={country ?? ""}
            id="edit-business-country"
            key={`country-${country ?? ""}`}
            maxLength={100}
            name="country"
            type="text"
          />
          <FieldError errors={editState.errors?.country} />
        </div>
        <div className="field">
          <label htmlFor="edit-business-category">Categoría</label>
          <select
            defaultValue={categoryId ?? ""}
            id="edit-business-category"
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
        <input name="businessId" type="hidden" value={businessId} />
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
