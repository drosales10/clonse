"use client";

import { useActionState } from "react";

import {
  adminDeleteUserAction,
  adminResetUserPasswordAction,
  adminSetUserLevelAction,
  adminSetUserSubnetworkAction,
  type AdminActionState,
} from "@/app/actions/admin";
import {
  AdminFieldError,
  AdminFormFeedback,
  AdminSubmitButton,
} from "@/app/components/admin/admin-form-primitives";

type LevelOption = { id: string; name: string };
type SubnetworkOption = { id: string; label: string };

export function AdminUserControls({
  userId,
  username,
  levelId,
  subnetworkId,
  levels,
  subnetworks,
}: {
  userId: string;
  username: string;
  levelId: string | null;
  subnetworkId: string | null;
  levels: LevelOption[];
  subnetworks: SubnetworkOption[];
}) {
  const [passwordState, passwordAction] = useActionState<AdminActionState, FormData>(
    adminResetUserPasswordAction,
    {},
  );
  const [levelState, levelAction] = useActionState<AdminActionState, FormData>(
    adminSetUserLevelAction,
    {},
  );
  const [subnetworkState, subnetworkAction] = useActionState<AdminActionState, FormData>(
    adminSetUserSubnetworkAction,
    {},
  );
  const [deleteState, deleteAction] = useActionState<AdminActionState, FormData>(
    adminDeleteUserAction,
    {},
  );

  return (
    <>
      <section className="admin-user-controls" aria-label="Nivel y subred">
        <h2>Nivel y subred</h2>
        <p className="lead">Asigna el nivel de permisos y la subred del catálogo legacy.</p>
        <form action={levelAction} className="settings-form admin-inline-form">
          <input name="userId" type="hidden" value={userId} />
          <div className="field">
            <label htmlFor="user-level">Nivel</label>
            <select defaultValue={levelId ?? ""} id="user-level" name="levelId">
              <option value="">Sin nivel asignado</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
          <AdminSubmitButton label="Guardar nivel" pendingLabel="Guardando…" />
          <AdminFormFeedback errors={levelState.errors} message={levelState.message} success={levelState.success} />
        </form>
        <form action={subnetworkAction} className="settings-form admin-inline-form">
          <input name="userId" type="hidden" value={userId} />
          <div className="field">
            <label htmlFor="user-subnetwork">Subred</label>
            <select defaultValue={subnetworkId ?? ""} id="user-subnetwork" name="subnetworkId">
              <option value="">Sin subred asignada</option>
              {subnetworks.map((subnetwork) => (
                <option key={subnetwork.id} value={subnetwork.id}>
                  {subnetwork.label}
                </option>
              ))}
            </select>
          </div>
          <AdminSubmitButton label="Guardar subred" pendingLabel="Guardando…" />
          <AdminFormFeedback
            errors={subnetworkState.errors}
            message={subnetworkState.message}
            success={subnetworkState.success}
          />
        </form>
      </section>

      <section className="admin-user-controls" aria-label="Restablecer contraseña">
        <h2>Restablecer contraseña</h2>
        <p className="lead">
          Define una contraseña nueva para @{username}. Se cerrarán todas sus sesiones activas.
        </p>
        <form action={passwordAction} className="settings-form admin-inline-form">
          <input name="userId" type="hidden" value={userId} />
          <div className="field-row">
            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input autoComplete="new-password" id="new-password" name="password" required type="password" />
              <AdminFieldError errors={passwordState.errors?.password} />
            </div>
            <div className="field">
              <label htmlFor="new-password-confirm">Confirmar</label>
              <input
                autoComplete="new-password"
                id="new-password-confirm"
                name="passwordConfirmation"
                required
                type="password"
              />
              <AdminFieldError errors={passwordState.errors?.passwordConfirmation} />
            </div>
          </div>
          <AdminSubmitButton label="Actualizar contraseña" pendingLabel="Guardando…" />
          <AdminFormFeedback errors={passwordState.errors} message={passwordState.message} success={passwordState.success} />
        </form>
      </section>

      <section className="admin-delete-panel" aria-labelledby="admin-user-delete-title">
        <h2 id="admin-user-delete-title">Eliminar usuario</h2>
        <p className="lead">
          Elimina permanentemente a <strong>@{username}</strong>. Solo es posible si no tiene contenido
          publicado ni mapeos de identidad legacy.
        </p>
        <form action={deleteAction} className="admin-delete-form">
          <input name="listPath" type="hidden" value="/admin/users" />
          <input name="userId" type="hidden" value={userId} />
          <AdminSubmitButton label="Eliminar usuario" pendingLabel="Eliminando…" quiet />
        </form>
        {deleteState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {deleteState.errors.form[0]}
          </p>
        ) : null}
      </section>
    </>
  );
}
