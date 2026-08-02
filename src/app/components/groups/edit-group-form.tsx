"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupManageFormState } from "@domain/groups";
import {
  setGroupApprovalRequiredAction,
  setGroupVisibleAction,
  updateGroupAction,
} from "@/app/actions/groups";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="groups-btn groups-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditGroupForm({
  groupId,
  title: initialTitle,
  description: initialDescription,
  categoryId,
  catalogVisible,
  membershipApprovalRequired,
  categories,
  cancelHref,
}: {
  groupId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  membershipApprovalRequired: boolean;
  categories: CategoryOption[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");

  const [editState, editAction] = useActionState<GroupManageFormState, FormData>(updateGroupAction, {});
  const [visibleState, visibleAction] = useActionState<GroupManageFormState, FormData>(setGroupVisibleAction, {});
  const [approvalState, approvalAction] = useActionState<GroupManageFormState, FormData>(
    setGroupApprovalRequiredAction,
    {},
  );

  return (
    <div className="groups-edit-layout">
      <form action={editAction} className="groups-form">
        <input name="groupId" type="hidden" value={groupId} />
        <div className="groups-field">
          <label htmlFor="edit-group-title">Título</label>
          <input
            id="edit-group-title"
            maxLength={120}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="groups-field-error" role="alert">{editState.errors.title[0]}</p>
          ) : null}
        </div>
        <div className="groups-field">
          <label htmlFor="edit-group-description">Descripción</label>
          <textarea
            id="edit-group-description"
            maxLength={2000}
            name="description"
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            value={description}
          />
          {editState.errors?.description?.[0] ? (
            <p className="groups-field-error" role="alert">{editState.errors.description[0]}</p>
          ) : null}
        </div>
        <div className="groups-field">
          <label htmlFor="edit-group-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-group-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? <p className="groups-form-success" role="status">{editState.message}</p> : null}
        {editState.errors?.form?.[0] ? (
          <p className="groups-form-error" role="alert">{editState.errors.form[0]}</p>
        ) : null}
        <div className="groups-form-actions">
          <Link className="groups-btn groups-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="groups-form groups-form-inline">
        <input name="groupId" type="hidden" value={groupId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="groups-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculto del catálogo"}.
        </p>
        <button className="groups-btn groups-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? <p className="groups-form-success" role="status">{visibleState.message}</p> : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="groups-form-error" role="alert">{visibleState.errors.form[0]}</p>
        ) : null}
      </form>

      <form action={approvalAction} className="groups-form groups-form-inline">
        <input name="groupId" type="hidden" value={groupId} />
        <input name="required" type="hidden" value={membershipApprovalRequired ? "0" : "1"} />
        <p className="groups-form-help">
          {membershipApprovalRequired
            ? "Las solicitudes requieren aprobación del propietario."
            : "Cualquier usuario puede unirse directamente."}
        </p>
        <button className="groups-btn groups-btn-secondary" type="submit">
          {membershipApprovalRequired
            ? "Desactivar aprobación de solicitudes"
            : "Requerir aprobación de solicitudes"}
        </button>
        {approvalState.message ? <p className="groups-form-success" role="status">{approvalState.message}</p> : null}
      </form>
    </div>
  );
}
