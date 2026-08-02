"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  adminSetArticleVisibleAction,
  adminSetBlogVisibleAction,
  adminSetBusinessVisibleAction,
  adminSetClassifiedVisibleAction,
  adminSetEventVisibleAction,
  adminSetGroupVisibleAction,
  type AdminActionState,
} from "@/app/actions/admin";

function PendingButton({
  label,
  pendingLabel,
  quiet = false,
}: {
  label: string;
  pendingLabel: string;
  quiet?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "button button-quiet button-small" : "button button-primary button-small"}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Feedback({ state }: { state: AdminActionState }) {
  if (state.message) {
    return (
      <p className={state.success ? "form-success" : "form-error"} role={state.success ? "status" : "alert"}>
        {state.message}
      </p>
    );
  }
  if (state.errors?.form?.[0]) {
    return (
      <p className="form-error" role="alert">
        {state.errors.form[0]}
      </p>
    );
  }
  return null;
}

export function AdminGroupControls({
  groupId,
  catalogVisible,
}: {
  groupId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetGroupVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="groupId" type="hidden" value={groupId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AdminEventControls({
  eventId,
  catalogVisible,
}: {
  eventId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetEventVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="eventId" type="hidden" value={eventId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AdminClassifiedControls({
  classifiedId,
  catalogVisible,
}: {
  classifiedId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetClassifiedVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="classifiedId" type="hidden" value={classifiedId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AdminBlogControls({
  entryId,
  catalogVisible,
}: {
  entryId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(adminSetBlogVisibleAction, {});

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="entryId" type="hidden" value={entryId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AdminBusinessControls({
  businessId,
  catalogVisible,
}: {
  businessId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetBusinessVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="businessId" type="hidden" value={businessId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AdminArticleControls({
  articleId,
  catalogVisible,
}: {
  articleId: string;
  catalogVisible: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adminSetArticleVisibleAction,
    {},
  );

  return (
    <div className="admin-poll-controls">
      <form action={formAction}>
        <input name="articleId" type="hidden" value={articleId} />
        <input name="visible" type="hidden" value={catalogVisible ? "0" : "1"} />
        <PendingButton
          label={catalogVisible ? "Ocultar" : "Mostrar"}
          pendingLabel="…"
          quiet={catalogVisible}
        />
      </form>
      <Feedback state={state} />
    </div>
  );
}
