"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ArticleManageFormState } from "@domain/articles";
import { setArticleVisibleAction, updateArticleAction } from "@/app/actions/articles";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const BODY_MAX = 10000;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="articles-btn articles-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

export function EditArticleForm({
  articleId,
  title: initialTitle,
  body: initialBody,
  categoryId,
  catalogVisible,
  categories,
  cancelHref,
}: {
  articleId: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  categories: CategoryOption[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? "");

  const [editState, editAction] = useActionState<ArticleManageFormState, FormData>(updateArticleAction, {});
  const [visibleState, visibleAction] = useActionState<ArticleManageFormState, FormData>(setArticleVisibleAction, {});

  return (
    <div className="articles-edit-layout">
      <form action={editAction} className="articles-form">
        <input name="articleId" type="hidden" value={articleId} />
        <div className="articles-field">
          <label htmlFor="edit-article-title">Título</label>
          <input
            id="edit-article-title"
            maxLength={TITLE_MAX}
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            type="text"
            value={title}
          />
          {editState.errors?.title?.[0] ? (
            <p className="articles-field-error" role="alert">{editState.errors.title[0]}</p>
          ) : null}
        </div>
        <div className="articles-field">
          <label htmlFor="edit-article-body">Contenido</label>
          <textarea
            id="edit-article-body"
            maxLength={BODY_MAX}
            name="body"
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            value={body}
          />
          {editState.errors?.body?.[0] ? (
            <p className="articles-field-error" role="alert">{editState.errors.body[0]}</p>
          ) : null}
        </div>
        <div className="articles-field">
          <label htmlFor="edit-article-category">Categoría</label>
          <select defaultValue={categoryId ?? ""} id="edit-article-category" name="categoryId">
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.title}` : category.title}
              </option>
            ))}
          </select>
        </div>
        {editState.message ? <p className="articles-form-success" role="status">{editState.message}</p> : null}
        {editState.errors?.form?.[0] ? (
          <p className="articles-form-error" role="alert">{editState.errors.form[0]}</p>
        ) : null}
        <div className="articles-form-actions">
          <Link className="articles-btn articles-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="articles-form articles-form-inline">
        <input name="articleId" type="hidden" value={articleId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="articles-form-help">
          Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculto del catálogo"}.
        </p>
        <button className="articles-btn articles-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? <p className="articles-form-success" role="status">{visibleState.message}</p> : null}
        {visibleState.errors?.form?.[0] ? (
          <p className="articles-form-error" role="alert">{visibleState.errors.form[0]}</p>
        ) : null}
      </form>
    </div>
  );
}
