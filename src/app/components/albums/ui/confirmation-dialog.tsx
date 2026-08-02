"use client";

import { useEffect, useId, useRef } from "react";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="albums-dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        aria-describedby={descId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="albums-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descId}>{description}</p>
        <div className="albums-dialog-actions">
          <button
            className="albums-btn albums-btn-secondary"
            disabled={pending}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={tone === "danger" ? "albums-btn albums-btn-danger" : "albums-btn albums-btn-primary"}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
