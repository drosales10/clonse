"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AlbumCreateFormState } from "@domain/albums";
import { createAlbumAction } from "@/app/actions/albums";

const TITLE_MAX = 120;
const DESC_MAX = 1000;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="albums-btn albums-btn-primary" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
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

export function CreateAlbumForm({ cancelHref = "/albums" }: { cancelHref?: string }) {
  const [state, formAction] = useActionState<AlbumCreateFormState, FormData>(createAlbumAction, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form action={formAction} className="albums-form" noValidate>
      <div className="albums-field">
        <label htmlFor="album-title">Título del álbum</label>
        <input
          id="album-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          required
          type="text"
          value={title}
        />
        <CharCounter max={TITLE_MAX} value={title} />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="albums-field">
        <label htmlFor="album-description">Descripción</label>
        <textarea
          id="album-description"
          maxLength={DESC_MAX}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          value={description}
        />
        <CharCounter max={DESC_MAX} value={description} />
        <FieldError errors={state.errors?.description} />
      </div>
      <fieldset className="albums-fieldset">
        <legend>Visibilidad en catálogo</legend>
        <label className="albums-radio">
          <input defaultChecked name="catalogVisible" type="radio" value="1" />
          <span>
            <strong>Visible públicamente</strong>
            <small>Cualquier persona autorizada podrá descubrirlo en el catálogo.</small>
          </span>
        </label>
        <label className="albums-radio">
          <input name="catalogVisible" type="radio" value="0" />
          <span>
            <strong>Solo visible para mí</strong>
            <small>El álbum no aparecerá en el catálogo; podrás compartir el enlace directo.</small>
          </span>
        </label>
      </fieldset>
      <p className="albums-form-help">
        Puedes cambiar la visibilidad más adelante desde la edición del álbum.
      </p>
      {state.errors?.form?.[0] ? (
        <p className="albums-form-error" role="alert">
          {state.errors.form[0]}
        </p>
      ) : null}
      <div className="albums-form-actions">
        <Link className="albums-btn albums-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton label="Crear álbum" pendingLabel="Creando…" />
      </div>
    </form>
  );
}
