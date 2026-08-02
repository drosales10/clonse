"use client";

import { useActionState, useMemo, useState } from "react";

import {
  ADMIN_MODULE_FLAG_SCHEMAS,
  ADMIN_PRIVACY_OPTIONS,
  type AdminModuleFlagsFormState,
  type AdminModuleKind,
} from "@domain/admin-flags";
import { adminUpdateModuleFlagsAction } from "@/app/actions/admin-flags";
import {
  AdminFieldError,
  AdminFormFeedback,
  AdminSubmitButton,
} from "@/app/components/admin/admin-form-primitives";

type AuditRow = {
  id: string;
  summary: string;
  createdAt: string;
  admin: { username: string; displayName: string };
};

type Snapshot = {
  kind: AdminModuleKind;
  resourceId: string;
  resourceLabel: string;
  values: Record<string, boolean | number | string | null>;
};

function toDatetimeLocal(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (value.length >= 16 && value.includes("T")) return value.slice(0, 16);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function needsConfirmation(
  kind: AdminModuleKind,
  values: Record<string, boolean | number | string | null>,
  draft: Record<string, boolean>,
): boolean {
  for (const field of ADMIN_MODULE_FLAG_SCHEMAS[kind]) {
    if (!field.confirmWhenFalse) continue;
    const was = Boolean(values[field.key]);
    const now = Boolean(draft[field.key]);
    if (was && !now) return true;
  }
  return false;
}

export function AdminModuleFlagsPanel({
  snapshot,
  audit,
}: {
  snapshot: Snapshot;
  audit: AuditRow[];
}) {
  const [state, formAction] = useActionState<AdminModuleFlagsFormState, FormData>(
    adminUpdateModuleFlagsAction,
    {},
  );
  const schema = ADMIN_MODULE_FLAG_SCHEMAS[snapshot.kind];
  const initialDraft = useMemo(() => {
    const draft: Record<string, boolean> = {};
    for (const field of schema) {
      if (field.type === "boolean") draft[field.key] = Boolean(snapshot.values[field.key]);
    }
    return draft;
  }, [schema, snapshot.values]);
  const [draft, setDraft] = useState(initialDraft);
  const confirmRequired = needsConfirmation(snapshot.kind, snapshot.values, draft);

  return (
    <section className="admin-user-controls admin-flags-panel" aria-labelledby="admin-flags-title">
      <h2 id="admin-flags-title">Activación y visibilidad</h2>
      <p className="lead">
        Controla cómo <strong>{snapshot.resourceLabel}</strong> aparece y se comporta en el área
        cliente. Los cambios se registran en auditoría.
      </p>

      <form action={formAction} className="settings-form admin-flags-form">
        <input name="kind" type="hidden" value={snapshot.kind} />
        <input name="resourceId" type="hidden" value={snapshot.resourceId} />

        {schema
          .filter((field) => field.type === "boolean")
          .map((field) => (
            <input
              key={`hidden-${field.key}`}
              name={field.key}
              type="hidden"
              value={draft[field.key] ? "1" : "0"}
            />
          ))}

        <div className="admin-flags-grid">
          {schema.map((field) => {
            if (field.type === "boolean") {
              const checked = draft[field.key] ?? Boolean(snapshot.values[field.key]);
              return (
                <label className="admin-flag-toggle" key={field.key}>
                  <input
                    checked={checked}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>{field.label}</strong>
                    {field.help ? <small>{field.help}</small> : null}
                  </span>
                </label>
              );
            }

            if (field.type === "privacy") {
              const current = snapshot.values[field.key];
              return (
                <div className="field admin-flag-select" key={field.key}>
                  <label htmlFor={`flag-${field.key}`}>{field.label}</label>
                  <select
                    defaultValue={current === null || current === undefined ? "" : String(current)}
                    id={`flag-${field.key}`}
                    name={field.key}
                  >
                    {field.key.includes("discussion") || field.key.includes("comments") ? (
                      <option value="">Heredar / sin override</option>
                    ) : null}
                    {ADMIN_PRIVACY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {field.help ? <span className="field-help">{field.help}</span> : null}
                </div>
              );
            }

            if (field.type === "datetime") {
              return (
                <div className="field admin-flag-select" key={field.key}>
                  <label htmlFor={`flag-${field.key}`}>{field.label}</label>
                  <input
                    defaultValue={toDatetimeLocal(snapshot.values[field.key])}
                    id={`flag-${field.key}`}
                    name={field.key}
                    type="datetime-local"
                  />
                  {field.help ? <span className="field-help">{field.help}</span> : null}
                </div>
              );
            }

            return null;
          })}
        </div>

        {confirmRequired ? (
          <div className="admin-flags-confirm">
            <label className="checkbox-label">
              <input name="confirmed" type="checkbox" value="1" />
              Confirmo ocultar o desactivar flags que afectan la visibilidad pública.
            </label>
          </div>
        ) : null}

        <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
        <AdminFieldError errors={state.errors?.form} />
        <AdminSubmitButton label="Guardar flags" pendingLabel="Guardando…" />
      </form>

      {audit.length > 0 ? (
        <div className="admin-audit-log">
          <h3>Auditoría reciente</h3>
          <ul>
            {audit.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.summary}</strong>
                <span>
                  {entry.admin.displayName} · {formatAuditDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="empty-state admin-audit-empty">Sin cambios registrados todavía.</p>
      )}
    </section>
  );
}

function formatAuditDate(value: string): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}
