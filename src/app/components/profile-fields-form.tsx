"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ProfileFieldRecord, ProfileFieldsFormState } from "@domain/profile-fields";
import { profileFieldInputName } from "@domain/profile-fields";
import { updateProfileFieldsAction } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar campos"}</button>;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error" role="alert">{errors[0]}</p>;
}

function FormMessage({ state }: { state: ProfileFieldsFormState }) {
  if (!state.message) return null;
  return <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>{state.message}</p>;
}

export function ProfileFieldsForm({ fields }: { fields: ProfileFieldRecord[] }) {
  const [state, formAction] = useActionState<ProfileFieldsFormState, FormData>(updateProfileFieldsAction, {});

  if (fields.length === 0) {
    return <p className="empty-state">Todavía no hay campos dinámicos configurados para este perfil.</p>;
  }

  return (
    <form action={formAction} className="settings-form profile-fields-form">
      {fields.map((field, index) => (
        <div className="profile-field-group" key={field.id}>
          {index === 0 || fields[index - 1].categoryId !== field.categoryId ? <h3>{field.categoryTitle}</h3> : null}
          <FieldControl field={field} errors={state.errors?.[field.id]} />
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
  const label = <label htmlFor={inputName}>{field.label}{field.required ? " *" : ""}</label>;
  const description = field.description ? <span className="field-help">{field.description}</span> : null;

  if (field.type === "checkbox") {
    const selected = Array.isArray(field.value) ? field.value : [];
    return (
      <fieldset className="field profile-field">
        <legend>{field.label}{field.required ? " *" : ""}</legend>
        {field.options.map((option) => (
          <label className="checkbox-row" key={option.value}>
            <input defaultChecked={selected.includes(option.value)} name={inputName} type="checkbox" value={option.value} />
            {option.label}
          </label>
        ))}
        {description}
        <FieldError errors={errors} />
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="field profile-field">
        {label}
        <select defaultValue={typeof field.value === "string" ? field.value : ""} id={inputName} name={inputName}>
          <option value="">Selecciona una opción</option>
          {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {description}
        <FieldError errors={errors} />
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset className="field profile-field">
        <legend>{field.label}{field.required ? " *" : ""}</legend>
        {field.options.map((option) => (
          <label className="radio-row" key={option.value}>
            <input defaultChecked={field.value === option.value} name={inputName} type="radio" value={option.value} />
            {option.label}
          </label>
        ))}
        {description}
        <FieldError errors={errors} />
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="field profile-field">
        {label}
        <textarea defaultValue={typeof field.value === "string" ? field.value : ""} id={inputName} maxLength={field.maxLength ?? undefined} name={inputName} rows={5} />
        {description}
        <FieldError errors={errors} />
      </div>
    );
  }

  return (
    <div className="field profile-field">
      {label}
      <input defaultValue={typeof field.value === "string" ? field.value : ""} id={inputName} maxLength={field.maxLength ?? undefined} name={inputName} type={field.type === "date" ? "date" : "text"} />
      {description}
      <FieldError errors={errors} />
    </div>
  );
}
