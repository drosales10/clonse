"use client";

import { useActionState } from "react";

import type { AdminActionState } from "@/app/actions/admin";
import { AdminSubmitButton } from "@/app/components/admin/admin-form-primitives";

export function AdminDeleteForm({
  action,
  resourceId,
  idFieldName,
  resourceLabel,
  listPath,
}: {
  action: (_previous: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  resourceId: string;
  idFieldName: string;
  resourceLabel: string;
  listPath: string;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(action, {});

  return (
    <section className="admin-delete-panel" aria-labelledby="admin-delete-title">
      <h2 id="admin-delete-title">Zona de peligro</h2>
      <p className="lead">
        Eliminar permanentemente <strong>{resourceLabel}</strong>. Esta acción no se puede deshacer.
      </p>
      <form action={formAction} className="admin-delete-form">
        <input name={idFieldName} type="hidden" value={resourceId} />
        <input name="listPath" type="hidden" value={listPath} />
        <AdminSubmitButton label="Eliminar" pendingLabel="Eliminando…" quiet />
      </form>
      {state.errors?.form?.[0] ? (
        <p className="form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
    </section>
  );
}
