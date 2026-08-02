"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BusinessCreateFormState } from "@domain/businesses";
import { createBusinessAction } from "@/app/actions/businesses";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const SUMMARY_MAX = 500;
const DESC_MAX = 5000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="businesses-btn businesses-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear negocio"}
    </button>
  );
}

export function CreateBusinessForm({
  categories,
  cancelHref = "/businesses",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<BusinessCreateFormState, FormData>(createBusinessAction, {});
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form action={formAction} className="businesses-form" noValidate>
      <div className="businesses-field">
        <label htmlFor="business-title">Título</label>
        <input
          id="business-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="businesses-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.title[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-summary">Resumen (opcional)</label>
        <textarea
          id="business-summary"
          maxLength={SUMMARY_MAX}
          name="summary"
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          value={summary}
        />
        <span className="businesses-char-counter">{SUMMARY_MAX - summary.length} caracteres restantes</span>
        {state.errors?.summary?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.summary[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-description">Descripción (opcional)</label>
        <textarea
          id="business-description"
          maxLength={DESC_MAX}
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          value={description}
        />
        <span className="businesses-char-counter">{DESC_MAX - description.length} caracteres restantes</span>
        {state.errors?.description?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.description[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-city">Ciudad (opcional)</label>
        <input id="business-city" maxLength={100} name="city" type="text" />
        {state.errors?.city?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.city[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-province">Provincia (opcional)</label>
        <input id="business-province" maxLength={100} name="province" type="text" />
        {state.errors?.province?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.province[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-country">País (opcional)</label>
        <input id="business-country" maxLength={100} name="country" type="text" />
        {state.errors?.country?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.country[0]}
          </p>
        ) : null}
      </div>
      <div className="businesses-field">
        <label htmlFor="business-category">Categoría (opcional)</label>
        <select defaultValue="" id="business-category" name="categoryId">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.title}` : category.title}
            </option>
          ))}
        </select>
        {state.errors?.categoryId?.[0] ? (
          <p className="businesses-field-error" role="alert">
            {state.errors.categoryId[0]}
          </p>
        ) : null}
      </div>
      {state.errors?.form?.[0] ? (
        <p className="businesses-form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <div className="businesses-form-actions">
        <Link className="businesses-btn businesses-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
