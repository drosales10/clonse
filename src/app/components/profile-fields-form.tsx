"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ProfileFieldRecord, ProfileFieldsFormState } from "@domain/profile-fields";
import { profileFieldInputName } from "@domain/profile-fields";
import { updateProfileFieldsAction } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar información"}
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

function FormMessage({ state }: { state: ProfileFieldsFormState }) {
  if (!state.message) return null;
  return (
    <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

function groupFieldsByCategory(fields: ProfileFieldRecord[]) {
  const byCategory = new Map<string, { title: string; fields: ProfileFieldRecord[] }>();
  for (const field of fields) {
    const current = byCategory.get(field.categoryId);
    if (current) {
      current.fields.push(field);
    } else {
      byCategory.set(field.categoryId, { title: field.categoryTitle, fields: [field] });
    }
  }
  return Array.from(byCategory.values());
}

export function ProfileFieldsForm({ fields }: { fields: ProfileFieldRecord[] }) {
  const [state, formAction] = useActionState<ProfileFieldsFormState, FormData>(
    updateProfileFieldsAction,
    {},
  );

  const groups = groupFieldsByCategory(fields);

  if (fields.length === 0) {
    return (
      <p className="empty-state">
        Todavía no hay campos dinámicos configurados para este perfil.
      </p>
    );
  }

  const filledCount = fields.filter((field) => {
    if (field.value === null) return false;
    return Array.isArray(field.value) ? field.value.length > 0 : field.value.trim() !== "";
  }).length;

  return (
    <form action={formAction} className="settings-form profile-fields-form">
      <p className="field-help profile-fields-progress">
        Completados {filledCount} de {fields.length} campos. Los cambios se reflejan en tu perfil público
        según tu privacidad.
      </p>
      {groups.map((group) => (
        <div className="profile-field-group" key={group.title}>
          <h3>{group.title}</h3>
          {group.fields.map((field) => (
            <FieldControl errors={state.errors?.[field.id]} field={field} key={field.id} />
          ))}
        </div>
      ))}
      <FieldError errors={state.errors?.form} />
      <FormMessage state={state} />
      <SubmitButton />
    </form>
  );
}

function FieldControl({ field, errors }: { field: ProfileFieldRecord; errors?: string[] }) {
  const inputName = profileFieldInputName(field.id);
  const label = (
    <label htmlFor={inputName}>
      {field.label}
      {field.required ? " *" : ""}
    </label>
  );
  const description = field.description ? <span className="field-help">{field.description}</span> : null;

  if (field.type === "checkbox") {
    const selected = Array.isArray(field.value) ? field.value : [];
    return (
      <fieldset className="field profile-field">
        <legend>
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        <div className="profile-option-grid">
          {field.options.map((option) => (
            <label className="checkbox-row" key={option.value}>
              <input
                defaultChecked={selected.includes(option.value)}
                name={inputName}
                type="checkbox"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        {description}
        <FieldError errors={errors} />
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="field profile-field">
        {label}
        <select
          defaultValue={typeof field.value === "string" ? field.value : ""}
          id={inputName}
          name={inputName}
        >
          <option value="">Selecciona una opción</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {description}
        <FieldError errors={errors} />
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset className="field profile-field">
        <legend>
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        <div className="profile-option-grid">
          {field.options.map((option) => (
            <label className="radio-row" key={option.value}>
              <input
                defaultChecked={field.value === option.value}
                name={inputName}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        {description}
        <FieldError errors={errors} />
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="field profile-field">
        {label}
        <textarea
          defaultValue={typeof field.value === "string" ? field.value : ""}
          id={inputName}
          maxLength={field.maxLength ?? undefined}
          name={inputName}
          placeholder={field.description ?? undefined}
          rows={5}
        />
        {description}
        <FieldError errors={errors} />
      </div>
    );
  }

  return (
    <div className="field profile-field">
      {label}
      <input
        defaultValue={typeof field.value === "string" ? field.value : ""}
        id={inputName}
        maxLength={field.maxLength ?? undefined}
        name={inputName}
        placeholder={field.type === "date" ? undefined : (field.description ?? undefined)}
        type={field.type === "date" ? "date" : "text"}
      />
      {description}
      <FieldError errors={errors} />
    </div>
  );
}
