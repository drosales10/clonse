"use client";

import { useActionState } from "react";

import type { AdminResourceFormState } from "@domain/admin-crud";
import {
  adminCreateLanguageVariableAction,
  adminCreateLevelAction,
  adminCreateSettingAction,
  adminCreateSubnetworkAction,
  adminUpdateForumCategoryAction,
  adminUpdateForumTopicAction,
  adminUpdateLanguageVariableAction,
  adminUpdateLevelAction,
  adminUpdateSettingAction,
  adminUpdateSubnetworkAction,
} from "@/app/actions/admin-content";
import {
  AdminFieldError,
  AdminFormFeedback,
  AdminSubmitButton,
} from "@/app/components/admin/admin-form-primitives";

type LevelData = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isSignup: boolean;
};

type SubnetworkData = {
  id: string;
  nameLegacyId: number;
  field1Qualifier: string;
  field1Value: string;
  field2Qualifier: string;
  field2Value: string;
  themeLegacyId: number;
};

type SettingData = {
  id: string;
  key: string;
  version: string;
  isOnline: boolean;
  urlEnabled: boolean;
  usernameEnabled: boolean;
  subnetField1Id: number;
  subnetField2Id: number;
};

type LanguageVariableData = {
  id: string;
  legacyId: number;
  languageId: number;
  value: string | null;
  defaultValue: string | null;
};

type ForumTopicData = {
  id: string;
  title: string;
  body: string | null;
  isLocked: boolean;
  isSticky: boolean;
  isAnnouncement: boolean;
};

type ForumCategoryData = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isLocked: boolean;
  publicCanRead: boolean;
};

export function AdminLevelForm({ mode, level }: { mode: "create" | "edit"; level?: LevelData }) {
  const action = mode === "create" ? adminCreateLevelAction : adminUpdateLevelAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      {level ? <input name="levelId" type="hidden" value={level.id} /> : null}
      <div className="field">
        <label htmlFor="level-name">Nombre</label>
        <input defaultValue={level?.name ?? ""} id="level-name" maxLength={120} name="name" required type="text" />
        <AdminFieldError errors={state.errors?.name} />
      </div>
      <div className="field">
        <label htmlFor="level-description">Descripción</label>
        <textarea defaultValue={level?.description ?? ""} id="level-description" maxLength={500} name="description" rows={3} />
        <AdminFieldError errors={state.errors?.description} />
      </div>
      <label className="checkbox-label">
        <input defaultChecked={level?.isDefault ?? false} name="isDefault" type="checkbox" value="1" />
        Nivel predeterminado
      </label>
      <label className="checkbox-label">
        <input defaultChecked={level?.isSignup ?? false} name="isSignup" type="checkbox" value="1" />
        Disponible en registro
      </label>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear nivel" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminSubnetworkForm({
  mode,
  subnetwork,
}: {
  mode: "create" | "edit";
  subnetwork?: SubnetworkData;
}) {
  const action = mode === "create" ? adminCreateSubnetworkAction : adminUpdateSubnetworkAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      {subnetwork ? <input name="subnetworkId" type="hidden" value={subnetwork.id} /> : null}
      <div className="field">
        <label htmlFor="subnet-name-id">Name legacy ID</label>
        <input defaultValue={subnetwork?.nameLegacyId ?? 0} id="subnet-name-id" name="nameLegacyId" required type="number" />
        <AdminFieldError errors={state.errors?.nameLegacyId} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="subnet-f1q">Campo 1 qualifier</label>
          <input defaultValue={subnetwork?.field1Qualifier ?? ""} id="subnet-f1q" maxLength={64} name="field1Qualifier" type="text" />
        </div>
        <div className="field">
          <label htmlFor="subnet-f1v">Campo 1 valor</label>
          <input defaultValue={subnetwork?.field1Value ?? ""} id="subnet-f1v" maxLength={255} name="field1Value" type="text" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="subnet-f2q">Campo 2 qualifier</label>
          <input defaultValue={subnetwork?.field2Qualifier ?? ""} id="subnet-f2q" maxLength={64} name="field2Qualifier" type="text" />
        </div>
        <div className="field">
          <label htmlFor="subnet-f2v">Campo 2 valor</label>
          <input defaultValue={subnetwork?.field2Value ?? ""} id="subnet-f2v" maxLength={255} name="field2Value" type="text" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="subnet-theme">Theme legacy ID</label>
        <input defaultValue={subnetwork?.themeLegacyId ?? 0} id="subnet-theme" name="themeLegacyId" required type="number" />
        <AdminFieldError errors={state.errors?.themeLegacyId} />
      </div>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear subred" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminSettingForm({ mode, setting }: { mode: "create" | "edit"; setting?: SettingData }) {
  const action = mode === "create" ? adminCreateSettingAction : adminUpdateSettingAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      {setting ? <input name="settingId" type="hidden" value={setting.id} /> : null}
      <div className="field">
        <label htmlFor="setting-key">Clave</label>
        <input defaultValue={setting?.key ?? ""} id="setting-key" maxLength={120} name="key" required type="text" />
        <AdminFieldError errors={state.errors?.key} />
      </div>
      <div className="field">
        <label htmlFor="setting-version">Versión</label>
        <input defaultValue={setting?.version ?? ""} id="setting-version" maxLength={32} name="version" type="text" />
        <AdminFieldError errors={state.errors?.version} />
      </div>
      <label className="checkbox-label">
        <input defaultChecked={setting?.isOnline ?? true} name="isOnline" type="checkbox" value="1" />
        En línea
      </label>
      <label className="checkbox-label">
        <input defaultChecked={setting?.urlEnabled ?? false} name="urlEnabled" type="checkbox" value="1" />
        URL habilitada
      </label>
      <label className="checkbox-label">
        <input defaultChecked={setting?.usernameEnabled ?? true} name="usernameEnabled" type="checkbox" value="1" />
        Username habilitado
      </label>
      <div className="field-row">
        <div className="field">
          <label htmlFor="setting-sf1">Subnet field 1 ID</label>
          <input defaultValue={setting?.subnetField1Id ?? -2} id="setting-sf1" name="subnetField1Id" required type="number" />
          <AdminFieldError errors={state.errors?.subnetField1Id} />
        </div>
        <div className="field">
          <label htmlFor="setting-sf2">Subnet field 2 ID</label>
          <input defaultValue={setting?.subnetField2Id ?? -2} id="setting-sf2" name="subnetField2Id" required type="number" />
          <AdminFieldError errors={state.errors?.subnetField2Id} />
        </div>
      </div>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear ajuste" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminLanguageVariableForm({
  mode,
  variable,
}: {
  mode: "create" | "edit";
  variable?: LanguageVariableData;
}) {
  const action = mode === "create" ? adminCreateLanguageVariableAction : adminUpdateLanguageVariableAction;
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(action, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      {variable ? <input name="variableId" type="hidden" value={variable.id} /> : null}
      <div className="field-row">
        <div className="field">
          <label htmlFor="lang-legacy">Legacy ID</label>
          <input defaultValue={variable?.legacyId ?? ""} id="lang-legacy" name="legacyId" required type="number" />
          <AdminFieldError errors={state.errors?.legacyId} />
        </div>
        <div className="field">
          <label htmlFor="lang-id">Language ID</label>
          <input defaultValue={variable?.languageId ?? ""} id="lang-id" name="languageId" required type="number" />
          <AdminFieldError errors={state.errors?.languageId} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lang-value">Valor</label>
        <textarea defaultValue={variable?.value ?? ""} id="lang-value" maxLength={2000} name="value" rows={3} />
        <AdminFieldError errors={state.errors?.value} />
      </div>
      <div className="field">
        <label htmlFor="lang-default">Valor por defecto</label>
        <textarea defaultValue={variable?.defaultValue ?? ""} id="lang-default" maxLength={2000} name="defaultValue" rows={3} />
        <AdminFieldError errors={state.errors?.defaultValue} />
      </div>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label={mode === "create" ? "Crear variable" : "Guardar cambios"} pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminForumTopicForm({ topic }: { topic: ForumTopicData }) {
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(adminUpdateForumTopicAction, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      <input name="topicId" type="hidden" value={topic.id} />
      <div className="field">
        <label htmlFor="forum-topic-title">Título</label>
        <input defaultValue={topic.title} id="forum-topic-title" maxLength={160} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="forum-topic-body">Mensaje</label>
        <textarea defaultValue={topic.body ?? ""} id="forum-topic-body" maxLength={8000} name="body" required rows={10} />
        <AdminFieldError errors={state.errors?.body} />
      </div>
      <label className="checkbox-label">
        <input defaultChecked={topic.isLocked} name="isLocked" type="checkbox" value="1" />
        Bloqueado
      </label>
      <label className="checkbox-label">
        <input defaultChecked={topic.isSticky} name="isSticky" type="checkbox" value="1" />
        Fijado (sticky)
      </label>
      <label className="checkbox-label">
        <input defaultChecked={topic.isAnnouncement} name="isAnnouncement" type="checkbox" value="1" />
        Anuncio
      </label>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
    </form>
  );
}

export function AdminForumCategoryForm({ category }: { category: ForumCategoryData }) {
  const [state, formAction] = useActionState<AdminResourceFormState, FormData>(adminUpdateForumCategoryAction, {});

  return (
    <form action={formAction} className="settings-form admin-resource-form">
      <input name="categoryId" type="hidden" value={category.id} />
      <div className="field">
        <label htmlFor="forum-cat-title">Título</label>
        <input defaultValue={category.title} id="forum-cat-title" maxLength={120} name="title" required type="text" />
        <AdminFieldError errors={state.errors?.title} />
      </div>
      <div className="field">
        <label htmlFor="forum-cat-desc">Descripción</label>
        <textarea defaultValue={category.description ?? ""} id="forum-cat-desc" name="description" rows={3} />
      </div>
      <div className="field">
        <label htmlFor="forum-cat-pos">Posición</label>
        <input defaultValue={category.position} id="forum-cat-pos" min={0} name="position" required type="number" />
        <AdminFieldError errors={state.errors?.position} />
      </div>
      <label className="checkbox-label">
        <input defaultChecked={category.isLocked} name="isLocked" type="checkbox" value="1" />
        Bloqueada
      </label>
      <label className="checkbox-label">
        <input defaultChecked={category.publicCanRead} name="publicCanRead" type="checkbox" value="1" />
        Lectura pública
      </label>
      <AdminFormFeedback errors={state.errors} message={state.message} success={state.success} />
      <AdminSubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
    </form>
  );
}
