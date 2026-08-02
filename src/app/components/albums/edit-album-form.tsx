"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AlbumManageFormState } from "@domain/albums";
import {
  deleteAlbumAction,
  setAlbumVisibleAction,
  updateAlbumAction,
} from "@/app/actions/albums";
import { ConfirmationDialog } from "@/app/components/albums/ui/confirmation-dialog";

const TITLE_MAX = 120;
const DESC_MAX = 1000;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="albums-btn albums-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="albums-field-error" role="alert">
      {errors[0]}
    </p>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  return (
    <span aria-live="polite" className={remaining < 20 ? "albums-char-counter is-low" : "albums-char-counter"}>
      {remaining} caracteres restantes
    </span>
  );
}

export function EditAlbumForm({
  albumId,
  title: initialTitle,
  description: initialDescription,
  catalogVisible,
  cancelHref,
}: {
  albumId: string;
  title: string;
  description: string | null;
  catalogVisible: boolean;
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [editState, editAction] = useActionState<AlbumManageFormState, FormData>(updateAlbumAction, {});
  const [visibleState, visibleAction] = useActionState<AlbumManageFormState, FormData>(
    setAlbumVisibleAction,
    {},
  );
  const [deleteState, deleteAction] = useActionState<AlbumManageFormState, FormData>(deleteAlbumAction, {});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="albums-edit-layout">
      <form action={editAction} className="albums-form">
        <input name="albumId" type="hidden" value={albumId} />
        <div className="albums-field">
          <label htmlFor="edit-album-title">Título del álbum</label>
          <input
            id="edit-album-title"
            maxLength={TITLE_MAX}
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            required
            type="text"
            value={title}
          />
          <CharCounter max={TITLE_MAX} value={title} />
          <FieldError errors={editState.errors?.title} />
        </div>
        <div className="albums-field">
          <label htmlFor="edit-album-description">Descripción</label>
          <textarea
            id="edit-album-description"
            maxLength={DESC_MAX}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            value={description}
          />
          <CharCounter max={DESC_MAX} value={description} />
          <FieldError errors={editState.errors?.description} />
        </div>
        {editState.message ? (
          <p className="albums-form-success" role="status">
            {editState.message}
          </p>
        ) : null}
        {editState.errors?.form?.[0] ? (
          <p className="albums-form-error" role="alert">
            {editState.errors.form[0]}
          </p>
        ) : null}
        <div className="albums-form-actions">
          <Link className="albums-btn albums-btn-secondary" href={cancelHref}>
            Cancelar
          </Link>
          <SaveButton />
        </div>
      </form>

      <form action={visibleAction} className="albums-form albums-form-inline">
        <input name="albumId" type="hidden" value={albumId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <fieldset className="albums-fieldset">
          <legend>Visibilidad en catálogo</legend>
          <p className="albums-form-help">
            Estado actual: {catalogVisible ? "Visible públicamente" : "Solo visible para ti"}.
          </p>
          <button className="albums-btn albums-btn-secondary" type="submit">
            {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
          </button>
        </fieldset>
        {visibleState.message ? (
          <p className="albums-form-success" role="status">
            {visibleState.message}
          </p>
        ) : null}
      </form>

      <section aria-labelledby="album-delete-title" className="albums-danger-panel">
        <h2 id="album-delete-title">Zona de peligro</h2>
        <p>
          Eliminar el álbum es permanente y puede afectar a las fotografías asociadas. Esta acción no se puede deshacer.
        </p>
        <button
          className="albums-btn albums-btn-danger"
          onClick={() => setConfirmOpen(true)}
          type="button"
        >
          Eliminar álbum
        </button>
        {deleteState.errors?.form?.[0] ? (
          <p className="albums-form-error" role="alert">
            {deleteState.errors.form[0]}
          </p>
        ) : null}
      </section>

      <form action={deleteAction} className="sr-only" ref={deleteFormRef}>
        <input name="albumId" type="hidden" value={albumId} />
      </form>

      <ConfirmationDialog
        confirmLabel="Eliminar álbum"
        description="Se borrarán el álbum y todas las fotografías asociadas. Los visitantes dejarán de poder acceder al contenido."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteFormRef.current?.requestSubmit();
        }}
        open={confirmOpen}
        pending={false}
        title="¿Eliminar este álbum?"
      />
    </div>
  );
}
