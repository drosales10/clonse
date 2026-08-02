"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { PollCreateFormState } from "@domain/polls";
import { createPollAction } from "@/app/actions/polls";

const TITLE_MAX = 120;
const DESC_MAX = 500;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="polls-btn polls-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear encuesta"}
    </button>
  );
}

export function CreatePollForm({ cancelHref = "/polls" }: { cancelHref?: string }) {
  const [state, formAction] = useActionState<PollCreateFormState, FormData>(createPollAction, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form action={formAction} className="polls-form" noValidate>
      <div className="polls-field">
        <label htmlFor="poll-title">Título de la encuesta</label>
        <input id="poll-title" maxLength={TITLE_MAX} name="title" onChange={(e) => setTitle(e.target.value)} required type="text" value={title} />
        <span className="polls-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="polls-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="polls-field">
        <label htmlFor="poll-description">Descripción (opcional)</label>
        <textarea id="poll-description" maxLength={DESC_MAX} name="description" onChange={(e) => setDescription(e.target.value)} rows={3} value={description} />
        <span className="polls-char-counter">{DESC_MAX - description.length} caracteres restantes</span>
      </div>
      <div className="polls-field">
        <label htmlFor="poll-options">Opciones</label>
        <textarea id="poll-options" name="options" placeholder={"Sí\nNo\nTal vez"} required rows={6} />
        <p className="polls-form-help">Una opción por línea. Mínimo 2, máximo 12.</p>
        {state.errors?.options?.[0] ? <p className="polls-field-error" role="alert">{state.errors.options[0]}</p> : null}
      </div>
      <fieldset className="polls-fieldset">
        <legend>Visibilidad en catálogo</legend>
        <label className="polls-radio">
          <input defaultChecked name="catalogVisible" type="radio" value="1" />
          <span><strong>Visible públicamente</strong><small>Aparecerá en el listado de encuestas.</small></span>
        </label>
        <label className="polls-radio">
          <input name="catalogVisible" type="radio" value="0" />
          <span><strong>Solo visible para mí</strong><small>Solo accesible por enlace directo.</small></span>
        </label>
      </fieldset>
      {state.errors?.form?.[0] ? <p className="polls-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="polls-form-actions">
        <Link className="polls-btn polls-btn-secondary" href={cancelHref}>Cancelar</Link>
        <SubmitButton />
      </div>
    </form>
  );
}
