"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { PollManageFormState } from "@domain/polls";
import {
  closeOwnPollAction,
  setPollVisibleAction,
  updatePollAction,
  updatePollOptionsAction,
} from "@/app/actions/polls";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function CloseButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-quiet" disabled={pending} type="submit">
      {pending ? "Cerrando…" : "Cerrar encuesta"}
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

export function PollOwnerControls({
  pollId,
  title,
  description,
  closed,
  catalogVisible,
  totalVotes,
  optionLabels,
}: {
  pollId: string;
  title: string;
  description: string | null;
  closed: boolean;
  catalogVisible: boolean;
  totalVotes: number;
  optionLabels: string[];
}) {
  const [editState, editAction] = useActionState<PollManageFormState, FormData>(updatePollAction, {});
  const [optionsState, optionsAction] = useActionState<PollManageFormState, FormData>(
    updatePollOptionsAction,
    {},
  );
  const [closeState, closeAction] = useActionState<PollManageFormState, FormData>(closeOwnPollAction, {});
  const [visibleState, visibleAction] = useActionState<PollManageFormState, FormData>(
    setPollVisibleAction,
    {},
  );

  return (
    <section className="owner-manage-panel" aria-label="Gestión de tu encuesta">
      <h2>Gestionar encuesta</h2>
      <form action={editAction} className="settings-form catalog-write-form">
        <input name="pollId" type="hidden" value={pollId} />
        <div className="field">
          <label htmlFor="edit-poll-title">Título</label>
          <input
            defaultValue={title}
            id="edit-poll-title"
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
          <label htmlFor="edit-poll-description">Descripción</label>
          <textarea
            defaultValue={description ?? ""}
            id="edit-poll-description"
            key={`desc-${description ?? ""}`}
            maxLength={500}
            name="description"
            rows={3}
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

      {totalVotes === 0 && !closed ? (
        <form action={optionsAction} className="settings-form catalog-write-form">
          <input name="pollId" type="hidden" value={pollId} />
          <div className="field">
            <label htmlFor="edit-poll-options">Opciones (una por línea)</label>
            <textarea
              defaultValue={optionLabels.join("\n")}
              id="edit-poll-options"
              key={`opts-${optionLabels.join("|")}`}
              name="options"
              required
              rows={5}
            />
            {optionsState.errors?.options?.[0] ? (
              <p className="field-error" role="alert">
                {optionsState.errors.options[0]}
              </p>
            ) : null}
          </div>
          {optionsState.errors?.form?.[0] ? (
            <p className="form-error" role="alert">
              {optionsState.errors.form[0]}
            </p>
          ) : null}
          {optionsState.message ? (
            <p className="form-success" role="status">
              {optionsState.message}
            </p>
          ) : null}
          <button className="button button-quiet" type="submit">
            Guardar opciones
          </button>
        </form>
      ) : totalVotes > 0 ? (
        <p className="field-help" role="status">
          Las opciones no se pueden editar después de recibir votos.
        </p>
      ) : null}

      {!closed ? (
        <form action={closeAction} className="owner-visibility-form">
          <input name="pollId" type="hidden" value={pollId} />
          <CloseButton />
          {closeState.message ? (
            <p className="form-success" role="status">
              {closeState.message}
            </p>
          ) : null}
          {closeState.errors?.form?.[0] ? (
            <p className="form-error" role="alert">
              {closeState.errors.form[0]}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="field-help" role="status">
          Esta encuesta está cerrada. Ya no acepta votos.
        </p>
      )}

      <form action={visibleAction} className="owner-visibility-form">
        <input name="pollId" type="hidden" value={pollId} />
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
