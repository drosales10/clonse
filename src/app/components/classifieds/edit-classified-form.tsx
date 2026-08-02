"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ClassifiedManageFormState } from "@domain/classifieds";
import { setClassifiedVisibleAction, updateClassifiedAction } from "@/app/actions/classifieds";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 5000;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="classifieds-btn classifieds-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditClassifiedForm({
  classifiedId,
  title: initialTitle,
  body: initialBody,
  categoryId,
  catalogVisible,
  categories,
  cancelHref,
}: {
  classifiedId: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? "");

  const [editState, editAction] = useActionState<ClassifiedManageFormState, FormData>(updateClassifiedAction, {});
  const [visibleState, visibleAction] = useActionState<ClassifiedManageFormState, FormData>(
    setClassifiedVisibleAction,
    {},
  );

  return (
    <div className="classifieds-edit-layout">
      <form action={editAction} className="classifieds-form">
        <input name="classifiedId" type="hidden" value={classifiedId} />
        <div className="classifieds-field">
          <label htmlFor="edit-classified-title">Título</label>
          <input
            id="edit-classified-title"
            maxLength={TITLE_MAX}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="classifieds-field-error" role="alert">
              {editState.errors.title[0]}
            </p>
          ) : null}
        </div>
        <div className="classifieds-field">
          <label htmlFor="edit-classified-body">Contenido</label>
          <textarea
            id="edit-classified-body"
            maxLength={BODY_MAX}
            name="body"
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            value={body}
          />
          {editState.errors?.body?.[0] ? (
            <p className="classifieds-field-error" role="alert">
              {editState.errors.body[0]}
            </p>
          ) : null}
        </div>
        <div className="classifieds-field">
          <label htmlFor="edit-classified-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-classified-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? (
          <p className="classifieds-form-success" role="status">
            {editState.message}
          </p>
        ) : null}
        {editState.errors?.form?.[0] ? (
          <p className="classifieds-form-error" role="alert">
            {editState.errors.form[0]}
          </p>
        ) : null}
        <div className="classifieds-form-actions">
          <Link className="classifieds-btn classifieds-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="classifieds-form classifieds-form-inline">
        <input name="classifiedId" type="hidden" value={classifiedId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="classifieds-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculto del catálogo"}.
        </p>
        <button className="classifieds-btn classifieds-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? (
          <p className="classifieds-form-success" role="status">
            {visibleState.message}
          </p>
        ) : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="classifieds-form-error" role="alert">
            {visibleState.errors.form[0]}
          </p>
        ) : null}
      </form>
    </div>
  );
}
