"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  adminSetForumCategoryLockedAction,
  adminSetForumTopicAnnouncementAction,
  adminSetForumTopicLockedAction,
  adminSetForumTopicStickyAction,
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

export function AdminForumTopicControls({
  topicId,
  isLocked,
  isSticky,
  isAnnouncement,
}: {
  topicId: string;
  isLocked: boolean;
  isSticky: boolean;
  isAnnouncement: boolean;
}) {
  const [lockedState, lockedAction] = useActionState<AdminActionState, FormData>(
    adminSetForumTopicLockedAction,
    {},
  );
  const [stickyState, stickyAction] = useActionState<AdminActionState, FormData>(
    adminSetForumTopicStickyAction,
    {},
  );
  const [announcementState, announcementAction] = useActionState<AdminActionState, FormData>(
    adminSetForumTopicAnnouncementAction,
    {},
  );

  return (
    <div className="admin-forum-controls">
      <form action={lockedAction}>
        <input name="topicId" type="hidden" value={topicId} />
        <input name="locked" type="hidden" value={isLocked ? "0" : "1"} />
        <PendingButton label={isLocked ? "Desbloquear" : "Bloquear"} pendingLabel="…" quiet={!isLocked} />
      </form>
      <form action={stickyAction}>
        <input name="topicId" type="hidden" value={topicId} />
        <input name="sticky" type="hidden" value={isSticky ? "0" : "1"} />
        <PendingButton label={isSticky ? "Desfijar" : "Fijar"} pendingLabel="…" quiet={isSticky} />
      </form>
      <form action={announcementAction}>
        <input name="topicId" type="hidden" value={topicId} />
        <input name="announcement" type="hidden" value={isAnnouncement ? "0" : "1"} />
        <PendingButton
          label={isAnnouncement ? "Quitar anuncio" : "Anuncio"}
          pendingLabel="…"
          quiet={isAnnouncement}
        />
      </form>
      <Feedback state={lockedState} />
      <Feedback state={stickyState} />
      <Feedback state={announcementState} />
    </div>
  );
}

export function AdminForumCategoryControls({
  categoryId,
  isLocked,
}: {
  categoryId: string;
  isLocked: boolean;
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(adminSetForumCategoryLockedAction, {});

  return (
    <div className="admin-forum-controls">
      <form action={action}>
        <input name="categoryId" type="hidden" value={categoryId} />
        <input name="locked" type="hidden" value={isLocked ? "0" : "1"} />
        <PendingButton label={isLocked ? "Desbloquear" : "Bloquear"} pendingLabel="…" quiet={!isLocked} />
      </form>
      <Feedback state={state} />
    </div>
  );
}
