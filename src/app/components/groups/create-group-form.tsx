"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupCreateFormState } from "@domain/groups";
import { createGroupAction } from "@/app/actions/groups";

type CategoryOption = { id: string; title: string; parentId: string | null };

const TITLE_MAX = 120;
const DESC_MAX = 2000;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="groups-btn groups-btn-primary" disabled={pending} type="submit">
      {pending ? "Creando…" : "Crear grupo"}
    </button>
  );
}

export function CreateGroupForm({
  categories,
  cancelHref = "/groups",
}: {
  categories: CategoryOption[];
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<GroupCreateFormState, FormData>(createGroupAction, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form action={formAction} className="groups-form" noValidate>
      <div className="groups-field">
        <label htmlFor="group-title">Título del grupo</label>
        <input
          id="group-title"
          maxLength={TITLE_MAX}
          name="title"
          onChange={(e) => setTitle(e.target.value)}
          required
          type="text"
          value={title}
        />
        <span className="groups-char-counter">{TITLE_MAX - title.length} caracteres restantes</span>
        {state.errors?.title?.[0] ? <p className="groups-field-error" role="alert">{state.errors.title[0]}</p> : null}
      </div>
      <div className="groups-field">
        <label htmlFor="group-description">Descripción (opcional)</label>
        <textarea
          id="group-description"
          maxLength={DESC_MAX}
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          value={description}
        />
        <span className="groups-char-counter">{DESC_MAX - description.length} caracteres restantes</span>
        {state.errors?.description?.[0] ? (
          <p className="groups-field-error" role="alert">{state.errors.description[0]}</p>
        ) : null}
      </div>
      <div className="groups-field">
        <label htmlFor="group-category">Categoría (opcional)</label>
        <select defaultValue="" id="group-category" name="categoryId">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.title}` : category.title}
            </option>
          ))}
        </select>
      </div>
      {state.errors?.form?.[0] ? <p className="groups-form-error" role="alert">{state.errors.form[0]}</p> : null}
      <div className="groups-form-actions">
        <Link className="groups-btn groups-btn-secondary" href={cancelHref}>
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
