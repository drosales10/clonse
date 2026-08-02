"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import {
  ALBUM_ALLOWED_EXTENSIONS,
  ALBUM_MAX_UPLOAD_BYTES,
  normalizeAlbumExtension,
} from "@domain/albums";
import { uploadAlbumMediaAction } from "@/app/actions/albums";
import { formatFileSize } from "@/app/components/albums/utils";

type FileEntry = {
  id: string;
  file: File;
  title: string;
  preview: string | null;
  status: "ready" | "invalid" | "uploading" | "done" | "error";
  error?: string;
  progress: number;
};

function validateFile(file: File): string | null {
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > ALBUM_MAX_UPLOAD_BYTES) return "Supera el límite de 5 MB.";
  const ext = normalizeAlbumExtension(file.name);
  if (!ext) return "Formato no permitido. Usa JPG, PNG, GIF o WebP.";
  return null;
}

function UploadFileItem({
  entry,
  onTitleChange,
  onRemove,
}: {
  entry: FileEntry;
  onTitleChange: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className={`albums-upload-item albums-upload-item-${entry.status}`}>
      <div className="albums-upload-item-preview">
        {entry.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={entry.preview} />
        ) : (
          <span aria-hidden="true">IMG</span>
        )}
      </div>
      <div className="albums-upload-item-body">
        <p className="albums-upload-item-name">{entry.file.name}</p>
        <p className="albums-upload-item-size">{formatFileSize(entry.file.size)}</p>
        {entry.status !== "invalid" ? (
          <label className="albums-upload-item-title">
            Título (opcional)
            <input
              maxLength={120}
              onChange={(event) => onTitleChange(entry.id, event.target.value)}
              type="text"
              value={entry.title}
            />
          </label>
        ) : null}
        {entry.error ? (
          <p className="albums-field-error" role="alert">
            {entry.error}
          </p>
        ) : null}
        {entry.status === "uploading" ? (
          <div aria-label="Progreso de carga" aria-valuemax={100} aria-valuemin={0} aria-valuenow={entry.progress} className="albums-upload-progress" role="progressbar">
            <span style={{ width: `${entry.progress}%` }} />
          </div>
        ) : null}
        {entry.status === "done" ? (
          <p className="albums-form-success" role="status">
            Subida completada
          </p>
        ) : null}
      </div>
      <button
        aria-label={`Quitar ${entry.file.name}`}
        className="albums-icon-btn"
        disabled={entry.status === "uploading"}
        onClick={() => onRemove(entry.id)}
        type="button"
      >
        ×
      </button>
    </li>
  );
}

export function UploadMediaPanel({
  albumId,
  cancelHref,
}: {
  albumId: string;
  cancelHref: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setGeneralError(null);
    setGeneralSuccess(null);
    setEntries((current) => [
      ...current,
      ...files.map((file) => {
        const error = validateFile(file);
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        return {
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          title: "",
          preview,
          status: error ? "invalid" : "ready",
          error: error ?? undefined,
          progress: 0,
        } satisfies FileEntry;
      }),
    ]);
  }, []);

  const removeEntry = (id: string) => {
    setEntries((current) => {
      const target = current.find((entry) => entry.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const updateTitle = (id: string, title: string) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, title } : entry)));
  };

  const uploadAll = async () => {
    const queue = entries.filter((entry) => entry.status === "ready" || entry.status === "error");
    if (queue.length === 0) {
      setGeneralError("Selecciona al menos un archivo válido.");
      return;
    }

    setIsUploading(true);
    setGeneralError(null);
    setGeneralSuccess(null);
    let failures = 0;

    for (const entry of queue) {
      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: "uploading", progress: 15, error: undefined } : item,
        ),
      );

      const formData = new FormData();
      formData.set("albumId", albumId);
      formData.set("title", entry.title);
      formData.set("file", entry.file);

      const result = await uploadAlbumMediaAction({}, formData);
      const failed = Boolean(result.errors?.form?.[0] || result.errors?.file?.[0]);
      if (failed) failures += 1;

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status: failed ? "error" : "done",
                progress: failed ? item.progress : 100,
                error: result.errors?.file?.[0] ?? result.errors?.form?.[0],
              }
            : item,
        ),
      );
    }

    setIsUploading(false);
    if (failures === 0) {
      setGeneralSuccess("Todas las fotografías se subieron correctamente.");
    } else if (failures < queue.length) {
      setGeneralError("Algunas fotografías no se pudieron subir. Revisa los archivos marcados.");
    } else {
      setGeneralError("No se pudo subir ninguna fotografía.");
    }
  };

  const readyCount = entries.filter((entry) => entry.status === "ready" || entry.status === "error").length;

  return (
    <div className="albums-upload-panel">
      <div
        className={dragOver ? "albums-dropzone is-dragover" : "albums-dropzone"}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
        }}
      >
        <p>Arrastra y suelta tus imágenes aquí</p>
        <p className="albums-dropzone-meta">
          {ALBUM_ALLOWED_EXTENSIONS.map((ext) => ext.toUpperCase()).join(", ")} · máx. 5 MB por archivo
        </p>
        <button
          className="albums-btn albums-btn-secondary"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Seleccionar archivos
        </button>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          className="sr-only"
          multiple
          onChange={(event) => {
            if (event.target.files?.length) addFiles(event.target.files);
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {entries.length === 0 ? (
        <p className="albums-upload-empty" role="status">
          Todavía no has seleccionado archivos.
        </p>
      ) : (
        <ul className="albums-upload-list">
          {entries.map((entry) => (
            <UploadFileItem entry={entry} key={entry.id} onRemove={removeEntry} onTitleChange={updateTitle} />
          ))}
        </ul>
      )}

      {generalError ? (
        <p className="albums-form-error" role="alert">
          {generalError}
        </p>
      ) : null}
      {generalSuccess ? (
        <p className="albums-form-success" role="status">
          {generalSuccess}
        </p>
      ) : null}

      <div className="albums-form-actions">
        <Link className="albums-btn albums-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <button
          className="albums-btn albums-btn-primary"
          disabled={isUploading || readyCount === 0}
          onClick={() => void uploadAll()}
          type="button"
        >
          {isUploading ? "Subiendo…" : `Subir fotografías${readyCount ? ` (${readyCount})` : ""}`}
        </button>
      </div>
    </div>
  );
}
