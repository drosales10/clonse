"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import type { PollManageFormState } from "@domain/polls";
import {
  closeOwnPollAction,
  deletePollAction,
  setPollVisibleAction,
  updatePollAction,
  updatePollOptionsAction,
} from "@/app/actions/polls";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="polls-btn polls-btn-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return (
    <div className="polls-dialog-backdrop" onClick={onCancel} role="presentation">
      <div aria-describedby={descId} aria-labelledby={titleId} aria-modal="true" className="polls-dialog" onClick={(e) => e.stopPropagation()} role="dialog">
        <h2 id={titleId}>{title}</h2>
        <p id={descId}>{description}</p>
        <div className="polls-dialog-actions">
          <button className="polls-btn polls-btn-secondary" onClick={onCancel} type="button">Cancelar</button>
          <button className="polls-btn polls-btn-danger" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function EditPollForm({
  pollId,
  title: initialTitle,
  description: initialDescription,
  catalogVisible,
  closed,
  totalVotes,
  optionLabels,
  cancelHref,
}: {
  pollId: string;
  title: string;
  description: string | null;
  catalogVisible: boolean;
  closed: boolean;
  totalVotes: number;
  optionLabels: string[];
  cancelHref: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [optionsText, setOptionsText] = useState(optionLabels.join("\n"));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const closeFormRef = useRef<HTMLFormElement>(null);

  const [editState, editAction] = useActionState<PollManageFormState, FormData>(updatePollAction, {});
  const [optionsState, optionsAction] = useActionState<PollManageFormState, FormData>(updatePollOptionsAction, {});
  const [closeState, closeAction] = useActionState<PollManageFormState, FormData>(closeOwnPollAction, {});
  const [visibleState, visibleAction] = useActionState<PollManageFormState, FormData>(setPollVisibleAction, {});
  const [, deleteAction] = useActionState<PollManageFormState, FormData>(deletePollAction, {});

  return (
    <div className="polls-edit-layout">
      <form action={editAction} className="polls-form">
        <input name="pollId" type="hidden" value={pollId} />
        <div className="polls-field">
          <label htmlFor="edit-poll-title">Título</label>
          <input id="edit-poll-title" maxLength={120} name="title" onChange={(e) => setTitle(e.target.value)} required type="text" value={title} />
          {editState.errors?.title?.[0] ? <p className="polls-field-error" role="alert">{editState.errors.title[0]}</p> : null}
        </div>
        <div className="polls-field">
          <label htmlFor="edit-poll-description">Descripción</label>
          <textarea id="edit-poll-description" maxLength={500} name="description" onChange={(e) => setDescription(e.target.value)} rows={3} value={description} />
        </div>
        {editState.message ? <p className="polls-form-success" role="status">{editState.message}</p> : null}
        {editState.errors?.form?.[0] ? <p className="polls-form-error" role="alert">{editState.errors.form[0]}</p> : null}
        <div className="polls-form-actions">
          <Link className="polls-btn polls-btn-secondary" href={cancelHref}>Cancelar</Link>
          <SaveButton />
        </div>
      </form>

      {totalVotes === 0 && !closed ? (
        <form action={optionsAction} className="polls-form">
          <input name="pollId" type="hidden" value={pollId} />
          <div className="polls-field">
            <label htmlFor="edit-poll-options">Opciones (una por línea)</label>
            <textarea id="edit-poll-options" name="options" onChange={(e) => setOptionsText(e.target.value)} required rows={6} value={optionsText} />
            {optionsState.errors?.options?.[0] ? <p className="polls-field-error" role="alert">{optionsState.errors.options[0]}</p> : null}
          </div>
          {optionsState.message ? <p className="polls-form-success" role="status">{optionsState.message}</p> : null}
          <button className="polls-btn polls-btn-secondary" type="submit">Guardar opciones</button>
        </form>
      ) : (
        <p className="polls-form-help" role="status">
          {totalVotes > 0 ? "Las opciones no se pueden editar después de recibir votos." : "La encuesta está cerrada."}
        </p>
      )}

      <form action={visibleAction} className="polls-form polls-form-inline">
        <input name="pollId" type="hidden" value={pollId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <p className="polls-form-help">Estado actual: {catalogVisible ? "Visible en catálogo" : "Oculta del catálogo"}.</p>
        <button className="polls-btn polls-btn-secondary" type="submit">
          {catalogVisible ? "Ocultar del catálogo" : "Mostrar en catálogo"}
        </button>
        {visibleState.message ? <p className="polls-form-success" role="status">{visibleState.message}</p> : null}
      </form>

      {!closed ? (
        <>
          <section className="polls-danger-panel">
            <h2>Cerrar encuesta</h2>
            <p>Al cerrar la encuesta, nadie podrá votar más.</p>
            <button className="polls-btn polls-btn-secondary" onClick={() => setConfirmClose(true)} type="button">
              Cerrar encuesta
            </button>
            {closeState.errors?.form?.[0] ? <p className="polls-form-error" role="alert">{closeState.errors.form[0]}</p> : null}
          </section>
          <form action={closeAction} className="sr-only" ref={closeFormRef}>
            <input name="pollId" type="hidden" value={pollId} />
          </form>
          <ConfirmationDialog
            confirmLabel="Cerrar encuesta"
            description="Los visitantes podrán ver resultados pero no registrar nuevos votos."
            onCancel={() => setConfirmClose(false)}
            onConfirm={() => {
              setConfirmClose(false);
              closeFormRef.current?.requestSubmit();
            }}
            open={confirmClose}
            title="¿Cerrar esta encuesta?"
          />
        </>
      ) : (
        <p className="polls-inline-notice" role="status">Esta encuesta está cerrada.</p>
      )}

      <section className="polls-danger-panel">
        <h2>Eliminar encuesta</h2>
        <p>Acción permanente. Se perderán votos y resultados asociados.</p>
        <button className="polls-btn polls-btn-danger" onClick={() => setConfirmDelete(true)} type="button">
          Eliminar encuesta
        </button>
      </section>
      <form action={deleteAction} className="sr-only" ref={deleteFormRef}>
        <input name="pollId" type="hidden" value={pollId} />
      </form>
      <ConfirmationDialog
        confirmLabel="Eliminar encuesta"
        description="Se borrarán la encuesta y todos los votos registrados."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteFormRef.current?.requestSubmit();
        }}
        open={confirmDelete}
        title="¿Eliminar esta encuesta?"
      />
    </div>
  );
}
