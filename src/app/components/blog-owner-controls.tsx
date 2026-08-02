"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BlogManageFormState } from "@domain/blogs";
import { setBlogVisibleAction, updateBlogAction } from "@/app/actions/blogs";

type CategoryOption = { id: string; title: string; parentId: string | null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function VisibilityButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-quiet" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
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

export function BlogOwnerControls({
  entryId,
  title,
  body,
  categoryId,
  catalogVisible,
  categories,
}: {
  entryId: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
}) {
  const [editState, editAction] = useActionState<BlogManageFormState, FormData>(updateBlogAction, {});
  const [visibleState, visibleAction] = useActionState<BlogManageFormState, FormData>(setBlogVisibleAction, {});

  return (
    <section className="owner-manage-panel" aria-labelledby="blog-manage-title">
      <h2 id="blog-manage-title">Gestionar entrada</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="entryId" type="hidden" value={entryId} />
        <div className="field">
          <label htmlFor="edit-blog-title">Título</label>
          <input
            defaultValue={title}
            id="edit-blog-title"
            key={`title-${title}`}
            maxLength={120}
            name="title"
            required
            type="text"
          />
          <FieldError errors={editState.errors?.title} />
        </div>
        <div className="field">
          <label htmlFor="edit-blog-body">Contenido</label>
          <textarea
            defaultValue={body ?? ""}
            id="edit-blog-body"
            key={`body-${body ?? ""}`}
            maxLength={10000}
            name="body"
            rows={8}
          />
          <FieldError errors={editState.errors?.body} />
        </div>
        <div className="field">
          <label htmlFor="edit-blog-category">Categoría</label>
          <select
            defaultValue={categoryId ?? ""}
            id="edit-blog-category"
            key={`cat-${categoryId ?? ""}`}
            name="categoryId"
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {editState.errors.form[0]}
          </p>
        ) : null}
        {editState.message ? (
          <p className="form-success" role="status">
            {editState.message}
          </p>
        ) : null}
        <SaveButton />
      </form>

      <form action={visibleAction} className="owner-visibility-form">
        <input name="entryId" type="hidden" value={entryId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <VisibilityButton
          label={catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
          pendingLabel="Actualizando…"
        />
        {visibleState.message ? (
          <p className="form-success" role="status">
            {visibleState.message}
          </p>
        ) : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {visibleState.errors.form[0]}
          </p>
        ) : null}
      </form>
    </section>
  );
}
