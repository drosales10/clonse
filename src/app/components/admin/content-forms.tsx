"use client";

import { useActionState } from "react";

import type { AdminResourceFormState } from "@domain/admin-crud";
import {
  adminCreateAlbumAction,
  adminCreateArticleAction,
  adminCreateBlogAction,
  adminCreateBusinessAction,
  adminCreateClassifiedAction,
  adminCreateEventAction,
  adminCreateGroupAction,
  adminCreatePollAction,
  adminUpdateAlbumAction,
  adminUpdateArticleAction,
  adminUpdateBlogAction,
  adminUpdateBusinessAction,
  adminUpdateClassifiedAction,
  adminUpdateEventAction,
  adminUpdateGroupAction,
  adminUpdatePollAction,
} from "@/app/actions/admin-content";
import {
  AdminCatalogFlagsFields,
  AdminCategorySelect,
  AdminFieldError,
  AdminFormFeedback,
  AdminOwnerUsernameField,
  AdminSubmitButton,
} from "@/app/components/admin/admin-form-primitives";

type CategoryOption = { id: string; title: string; parentId: string | null };

type GroupFormData = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  membershipApprovalRequired: boolean;
};

type EventFormData = {
  id: string;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  inviteOnly: boolean;
};

type PollFormData = {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  closed: boolean;
  catalogVisible: boolean;
  searchable: boolean;
  totalVotes: number;
};

type AlbumFormData = {
  id: string;
  title: string;
  description: string | null;
  catalogVisible: boolean;
  searchable: boolean;
};

type ClassifiedFormData = {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
};

type BlogFormData = {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
};

type BusinessFormData = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
};

type ArticleFormData = {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  draft: boolean;
  approved: boolean;
};

function toDatetimeLocal(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function AdminGroupForm({
  mode,
  categories,
  group,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  group?: GroupFormData;
}) {
  const action = mode === "create" ? adminCreateGroupAction : adminUpdateGroupAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {group ? <input name="groupId" type="hidden" value={group.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="group-title">Título</label>
        <input defaultValue={group?.title ?? ""} id="group-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="group-description">Descripción</label>
        <textarea defaultValue={group?.description ?? ""} id="group-description" maxLength={2000} name="description" rows={5} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <AdminCategorySelect categories={categories} defaultValue={group?.categoryId} id="group-category" />
      <label className="checkbox-label">
        <input defaultChecked={group?.membershipApprovalRequired ?? false} name="membershipApprovalRequired" type="checkbox" value="1" />
        Requiere aprobación de membresía
      </label>
      <AdminCatalogFlagsFields catalogVisible={group?.catalogVisible ?? true} searchable={group?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear grupo" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminEventForm({
  mode,
  categories,
  event,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  event?: EventFormData;
}) {
  const action = mode === "create" ? adminCreateEventAction : adminUpdateEventAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {event ? <input name="eventId" type="hidden" value={event.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="event-title">Título</label>
        <input defaultValue={event?.title ?? ""} id="event-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="event-description">Descripción</label>
        <textarea defaultValue={event?.description ?? ""} id="event-description" maxLength={2000} name="description" rows={4} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <div className="field">
        <label htmlFor="event-host">Organizador</label>
        <input defaultValue={event?.host ?? ""} id="event-host" maxLength={120} name="host" type="text" />
        <AdminFieldError errors={state.errors?.host} />
      </div>
      <div className="field">
        <label htmlFor="event-location">Ubicación</label>
        <input defaultValue={event?.location ?? ""} id="event-location" maxLength={200} name="location" type="text" />
        <AdminFieldError errors={state.errors?.location} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="event-starts">Inicio</label>
          <input defaultValue={toDatetimeLocal(event?.startsAt ?? null)} id="event-starts" name="startsAt" type="datetime-local" />
          <AdminFieldError errors={state.errors?.startsAt} />
        </div>
        <div className="field">
          <label htmlFor="event-ends">Fin</label>
          <input defaultValue={toDatetimeLocal(event?.endsAt ?? null)} id="event-ends" name="endsAt" type="datetime-local" />
          <AdminFieldError errors={state.errors?.endsAt} />
        </div>
      </div>
      <AdminCategorySelect categories={categories} defaultValue={event?.categoryId} id="event-category" />
      <label className="checkbox-label">
        <input defaultChecked={event?.inviteOnly ?? false} name="inviteOnly" type="checkbox" value="1" />
        Solo por invitación
      </label>
      <AdminCatalogFlagsFields catalogVisible={event?.catalogVisible ?? true} searchable={event?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear evento" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminPollForm({ mode, poll }: { mode: "create" | "edit"; poll?: PollFormData }) {
  const action = mode === "create" ? adminCreatePollAction : adminUpdatePollAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form poll-create-form admin-resource-form">
      {poll ? <input name="pollId" type="hidden" value={poll.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="poll-title">Título</label>
        <input defaultValue={poll?.title ?? ""} id="poll-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="poll-description">Descripción</label>
        <textarea defaultValue={poll?.description ?? ""} id="poll-description" maxLength={500} name="description" rows={3} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <div className="field">
        <label htmlFor="poll-options">Opciones</label>
        <textarea
          defaultValue={poll?.options.join("\n") ?? ""}
          id="poll-options"
          name="options"
          placeholder={"Sí\nNo"}
          required={mode === "create"}
          rows={6}
        />
        <span className="field-help">
          {poll && poll.totalVotes > 0
            ? "No se pueden editar opciones con votos registrados."
            : "Una opción por línea. Mínimo 2, máximo 12."}
        </span>
        <AdminFieldError errors={state.errors?.options} />
      </div>
      {mode === "edit" ? (
        <label className="checkbox-label">
          <input defaultChecked={poll?.closed ?? false} name="closed" type="checkbox" value="1" />
          Encuesta cerrada
        </label>
      ) : null}
      <AdminCatalogFlagsFields catalogVisible={poll?.catalogVisible ?? true} searchable={poll?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear encuesta" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminAlbumForm({ mode, album }: { mode: "create" | "edit"; album?: AlbumFormData }) {
  const action = mode === "create" ? adminCreateAlbumAction : adminUpdateAlbumAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {album ? <input name="albumId" type="hidden" value={album.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="album-title">Título</label>
        <input defaultValue={album?.title ?? ""} id="album-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="album-description">Descripción</label>
        <textarea defaultValue={album?.description ?? ""} id="album-description" maxLength={1000} name="description" rows={4} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <AdminCatalogFlagsFields catalogVisible={album?.catalogVisible ?? true} searchable={album?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear álbum" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminClassifiedForm({
  mode,
  categories,
  classified,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  classified?: ClassifiedFormData;
}) {
  const action = mode === "create" ? adminCreateClassifiedAction : adminUpdateClassifiedAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {classified ? <input name="classifiedId" type="hidden" value={classified.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="classified-title">Título</label>
        <input defaultValue={classified?.title ?? ""} id="classified-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="classified-body">Contenido</label>
        <textarea defaultValue={classified?.body ?? ""} id="classified-body" maxLength={5000} name="body" rows={8} />
        <AdminFieldError errors={state.errors?.body} />
      </div>
      <AdminCategorySelect categories={categories} defaultValue={classified?.categoryId} id="classified-category" />
      <AdminCatalogFlagsFields catalogVisible={classified?.catalogVisible ?? true} searchable={classified?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear clasificado" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminBlogForm({
  mode,
  categories,
  entry,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  entry?: BlogFormData;
}) {
  const action = mode === "create" ? adminCreateBlogAction : adminUpdateBlogAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {entry ? <input name="entryId" type="hidden" value={entry.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="blog-title">Título</label>
        <input defaultValue={entry?.title ?? ""} id="blog-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="blog-body">Contenido</label>
        <textarea defaultValue={entry?.body ?? ""} id="blog-body" maxLength={10000} name="body" rows={10} />
        <AdminFieldError errors={state.errors?.body} />
      </div>
      <AdminCategorySelect categories={categories} defaultValue={entry?.categoryId} id="blog-category" />
      <AdminCatalogFlagsFields catalogVisible={entry?.catalogVisible ?? true} searchable={entry?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear entrada" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminBusinessForm({
  mode,
  categories,
  business,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  business?: BusinessFormData;
}) {
  const action = mode === "create" ? adminCreateBusinessAction : adminUpdateBusinessAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {business ? <input name="businessId" type="hidden" value={business.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="business-title">Título</label>
        <input defaultValue={business?.title ?? ""} id="business-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="business-summary">Resumen</label>
        <textarea defaultValue={business?.summary ?? ""} id="business-summary" maxLength={500} name="summary" rows={3} />
        <AdminFieldError errors={state.errors?.summary} />
      </div>
      <div className="field">
        <label htmlFor="business-description">Descripción</label>
        <textarea defaultValue={business?.description ?? ""} id="business-description" maxLength={5000} name="description" rows={8} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="business-city">Ciudad</label>
          <input defaultValue={business?.city ?? ""} id="business-city" maxLength={100} name="city" type="text" />
          <AdminFieldError errors={state.errors?.city} />
        </div>
        <div className="field">
          <label htmlFor="business-province">Provincia</label>
          <input defaultValue={business?.province ?? ""} id="business-province" maxLength={100} name="province" type="text" />
          <AdminFieldError errors={state.errors?.province} />
        </div>
        <div className="field">
          <label htmlFor="business-country">País</label>
          <input defaultValue={business?.country ?? ""} id="business-country" maxLength={100} name="country" type="text" />
          <AdminFieldError errors={state.errors?.country} />
        </div>
      </div>
      <AdminCategorySelect categories={categories} defaultValue={business?.categoryId} id="business-category" />
      <AdminCatalogFlagsFields catalogVisible={business?.catalogVisible ?? true} searchable={business?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear negocio" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminArticleForm({
  mode,
  categories,
  article,
}: {
  mode: "create" | "edit";
  categories: CategoryOption[];
  article?: ArticleFormData;
}) {
  const action = mode === "create" ? adminCreateArticleAction : adminUpdateArticleAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form catalog-write-form admin-resource-form">
      {article ? <input name="articleId" type="hidden" value={article.id} /> : null}
      {mode === "create" ? <AdminOwnerUsernameField errors={state.errors?.ownerUsername} /> : null}
      <div className="field">
        <label htmlFor="article-title">Título</label>
        <input defaultValue={article?.title ?? ""} id="article-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="article-body">Contenido</label>
        <textarea defaultValue={article?.body ?? ""} id="article-body" maxLength={10000} name="body" rows={10} />
        <AdminFieldError errors={state.errors?.body} />
      </div>
      <AdminCategorySelect categories={categories} defaultValue={article?.categoryId} id="article-category" />
      <label className="checkbox-label">
        <input defaultChecked={article?.draft ?? false} name="draft" type="checkbox" value="1" />
        Borrador
      </label>
      <label className="checkbox-label">
        <input defaultChecked={article?.approved ?? true} name="approved" type="checkbox" value="1" />
        Aprobado
      </label>
      <AdminCatalogFlagsFields catalogVisible={article?.catalogVisible ?? true} searchable={article?.searchable ?? true} />
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear artículo" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}
