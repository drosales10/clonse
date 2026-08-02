"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({
  label,
  pendingLabel,
  quiet = false,
}: {
  label: string;
  pendingLabel: string;
  quiet?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "button button-quiet" : "button button-primary"}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AdminFieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" role="alert">
      {errors[0]}
    </p>
  );
}

export function AdminFormFeedback({
  errors,
  message,
  success,
}: {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
}) {
  if (message) {
    return (
      <p className={success ? "form-success" : "form-error"} role={success ? "status" : "alert"}>
        {message}
      </p>
    );
  }
  if (errors?.form?.[0]) {
    return (
      <p className="form-error" role="alert">
        {errors.form[0]}
      </p>
    );
  }
  return null;
}

export function AdminOwnerUsernameField({
  defaultValue = "",
  errors,
  required = true,
}: {
  defaultValue?: string;
  errors?: string[];
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor="ownerUsername">Usuario propietario</label>
      <input
        defaultValue={defaultValue}
        id="ownerUsername"
        maxLength={64}
        name="ownerUsername"
        placeholder="nombreusuario"
        required={required}
        type="text"
      />
      <span className="field-help">Sin @. Debe ser un usuario habilitado.</span>
      <AdminFieldError errors={errors} />
    </div>
  );
}

export function AdminCatalogFlagsFields({
  catalogVisible,
  searchable,
}: {
  catalogVisible: boolean;
  searchable: boolean;
}) {
  return (
    <fieldset className="admin-flag-fieldset">
      <legend>Visibilidad</legend>
      <label className="checkbox-label">
        <input defaultChecked={catalogVisible} name="catalogVisible" type="checkbox" value="1" />
        Visible en catálogo
      </label>
      <label className="checkbox-label">
        <input defaultChecked={searchable} name="searchable" type="checkbox" value="1" />
        Indexable / buscable
      </label>
    </fieldset>
  );
}

export function AdminCategorySelect({
  categories,
  defaultValue = "",
  id,
  label = "Categoría (opcional)",
}: {
  categories: { id: string; title: string; parentId: string | null }[];
  defaultValue?: string | null;
  id: string;
  label?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select defaultValue={defaultValue ?? ""} id={id} name="categoryId">
        <option value="">Sin categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.parentId ? `— ${category.title}` : category.title}
          </option>
        ))}
      </select>
    </div>
  );
}
