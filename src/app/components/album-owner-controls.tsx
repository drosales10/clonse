"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AlbumManageFormState } from "@domain/albums";
import { setAlbumVisibleAction, updateAlbumAction } from "@/app/actions/albums";

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

export function AlbumOwnerControls({
  albumId,
  title,
  description,
  catalogVisible,
}: {
  albumId: string;
  title: string;
  description: string | null;
  catalogVisible: boolean;
}) {
  const [editState, editAction] = useActionState<AlbumManageFormState, FormData>(updateAlbumAction, {});
  const [visibleState, visibleAction] = useActionState<AlbumManageFormState, FormData>(
    setAlbumVisibleAction,
    {},
  );

  return (
    <section className="owner-manage-panel" aria-labelledby="album-manage-title">
      <h2 id="album-manage-title">Gestionar álbum</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="albumId" type="hidden" value={albumId} />
        <div className="field">
          <label htmlFor="edit-album-title">Título</label>
          <input
            defaultValue={title}
            id="edit-album-title"
            key={`title-${title}`}
            maxLength={120}
            name="title"
            required
            type="text"
          />
          {editState.errors?.title?.[0] ? (
            <p className="field-error" role="alert">
              {editState.errors.title[0]}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="edit-album-description">Descripción</label>
          <textarea
            defaultValue={description ?? ""}
            id="edit-album-description"
            key={`desc-${description ?? ""}`}
            maxLength={1000}
            name="description"
            rows={4}
          />
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
        <input name="albumId" type="hidden" value={albumId} />
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
      </form>
    </section>
  );
}
