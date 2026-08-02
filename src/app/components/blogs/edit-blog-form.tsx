"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BlogManageFormState } from "@domain/blogs";
import { setBlogVisibleAction, updateBlogAction } from "@/app/actions/blogs";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 10000;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="blogs-btn blogs-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditBlogForm({
  entryId,
  title: initialTitle,
  body: initialBody,
  categoryId,
  catalogVisible,
  categories,
  cancelHref,
}: {
  entryId: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? "");

  const [editState, editAction] = useActionState<BlogManageFormState, FormData>(updateBlogAction, {});
  const [visibleState, visibleAction] = useActionState<BlogManageFormState, FormData>(setBlogVisibleAction, {});

  return (
    <div className="blogs-edit-layout">
      <form action={editAction} className="blogs-form">
        <input name="entryId" type="hidden" value={entryId} />
        <div className="blogs-field">
          <label htmlFor="edit-blog-title">Título</label>
          <input
            id="edit-blog-title"
            maxLength={TITLE_MAX}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="blogs-field-error" role="alert">{editState.errors.title[0]}</p>
          ) : null}
        </div>
        <div className="blogs-field">
          <label htmlFor="edit-blog-body">Contenido</label>
          <textarea
            id="edit-blog-body"
            maxLength={BODY_MAX}
            name="body"
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            value={body}
          />
          {editState.errors?.body?.[0] ? (
            <p className="blogs-field-error" role="alert">{editState.errors.body[0]}</p>
          ) : null}
        </div>
        <div className="blogs-field">
          <label htmlFor="edit-blog-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-blog-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? <p className="blogs-form-success" role="status">{editState.message}</p> : null}
        {editState.errors?.form?.[0] ? (
          <p className="blogs-form-error" role="alert">{editState.errors.form[0]}</p>
        ) : null}
        <div className="blogs-form-actions">
          <Link className="blogs-btn blogs-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="blogs-form blogs-form-inline">
        <input name="entryId" type="hidden" value={entryId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="blogs-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculta del catálogo"}.
        </p>
        <button className="blogs-btn blogs-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? <p className="blogs-form-success" role="status">{visibleState.message}</p> : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="blogs-form-error" role="alert">{visibleState.errors.form[0]}</p>
        ) : null}
      </form>
    </div>
  );
}
