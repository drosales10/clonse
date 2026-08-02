"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AlbumUploadFormState } from "@domain/albums";
import { uploadAlbumMediaAction } from "@/app/actions/albums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Subiendo…" : "Subir imagen"}
    </button>
  );
}

export function AlbumUploadForm({ albumId }: { albumId: string }) {
  const [state, formAction] = useActionState<AlbumUploadFormState, FormData>(
    uploadAlbumMediaAction,
    {},
  );

  return (
    <section className="album-upload-panel" aria-labelledby="album-upload-title">
      <h2 id="album-upload-title">Añadir imagen</h2>
      <p className="field-help">JPG, PNG, GIF o WebP · máximo 5 MB</p>
      <form action={formAction} className="album-upload-form" encType="multipart/form-data">
        <input name="albumId" type="hidden" value={albumId} />
        <div className="field">
          <label htmlFor="album-media-title">Título (opcional)</label>
          <input id="album-media-title" maxLength={120} name="title" type="text" />
        </div>
        <div className="field">
          <label htmlFor="album-media-file">Archivo</label>
          <input
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            id="album-media-file"
            name="file"
            required
            type="file"
          />
          {state.errors?.file?.[0] ? (
            <p className="field-error" role="alert">
              {state.errors.file[0]}
            </p>
          ) : null}
        </div>
        {state.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {state.errors.form[0]}
          </p>
        ) : null}
        {state.message ? (
          <p className="form-success" role="status">
            {state.message}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </section>
  );
}
