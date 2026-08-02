"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BusinessManageFormState } from "@domain/businesses";
import { setBusinessVisibleAction, updateBusinessAction } from "@/app/actions/businesses";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="businesses-btn businesses-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditBusinessForm({
  businessId,
  title: initialTitle,
  summary: initialSummary,
  description: initialDescription,
  city: initialCity,
  province: initialProvince,
  country: initialCountry,
  categoryId,
  catalogVisible,
  categories,
  cancelHref,
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
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [province, setProvince] = useState(initialProvince ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");

  const [editState, editAction] = useActionState<BusinessManageFormState, FormData>(updateBusinessAction, {});
  const [visibleState, visibleAction] = useActionState<BusinessManageFormState, FormData>(
    setBusinessVisibleAction,
    {},
  );

  return (
    <div className="businesses-edit-layout">
      <form action={editAction} className="businesses-form">
        <input name="businessId" type="hidden" value={businessId} />
        <div className="businesses-field">
          <label htmlFor="edit-business-title">Título</label>
          <input
            id="edit-business-title"
            maxLength={120}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.title[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-summary">Resumen</label>
          <textarea
            id="edit-business-summary"
            maxLength={500}
            name="summary"
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            value={summary}
          />
          {editState.errors?.summary?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.summary[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-description">Descripción</label>
          <textarea
            id="edit-business-description"
            maxLength={5000}
            name="description"
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            value={description}
          />
          {editState.errors?.description?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.description[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-city">Ciudad</label>
          <input
            id="edit-business-city"
            maxLength={100}
            name="city"
            onChange={(e) => setCity(e.target.value)}
            type="text"
            value={city}
          />
          {editState.errors?.city?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.city[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-province">Provincia</label>
          <input
            id="edit-business-province"
            maxLength={100}
            name="province"
            onChange={(e) => setProvince(e.target.value)}
            type="text"
            value={province}
          />
          {editState.errors?.province?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.province[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-country">País</label>
          <input
            id="edit-business-country"
            maxLength={100}
            name="country"
            onChange={(e) => setCountry(e.target.value)}
            type="text"
            value={country}
          />
          {editState.errors?.country?.[0] ? (
            <p className="businesses-field-error" role="alert">
              {editState.errors.country[0]}
            </p>
          ) : null}
        </div>
        <div className="businesses-field">
          <label htmlFor="edit-business-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-business-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? (
          <p className="businesses-form-success" role="status">
            {editState.message}
          </p>
        ) : null}
        {editState.errors?.form?.[0] ? (
          <p className="businesses-form-error" role="alert">
            {editState.errors.form[0]}
          </p>
        ) : null}
        <div className="businesses-form-actions">
          <Link className="businesses-btn businesses-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="businesses-form businesses-form-inline">
        <input name="businessId" type="hidden" value={businessId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="businesses-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculto del catálogo"}.
        </p>
        <button className="businesses-btn businesses-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? (
          <p className="businesses-form-success" role="status">
            {visibleState.message}
          </p>
        ) : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="businesses-form-error" role="alert">
            {visibleState.errors.form[0]}
          </p>
        ) : null}
      </form>
    </div>
  );
}
