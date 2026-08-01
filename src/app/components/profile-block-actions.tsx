"use client";

import { useActionState } from "react";

import type { BlockActionState } from "@domain/blocks";
import { blockUserAction, unblockUserAction } from "@/app/actions/blocks";

export function ProfileBlockActions({
  blockedByViewer,
  username,
}: {
  blockedByViewer: boolean;
  username: string;
}) {
  const [blockState, blockAction] = useActionState<BlockActionState, FormData>(blockUserAction, {});
  const [unblockState, unblockAction] = useActionState<BlockActionState, FormData>(unblockUserAction, {});
  const action = blockedByViewer ? unblockAction : blockAction;
  const state = blockedByViewer ? unblockState : blockState;

  return (
    <div className="profile-block-actions">
      {blockedByViewer ? (
        <>
          <p className="relationship-status">Has bloqueado este perfil.</p>
          <ActionForm action={action} label="Desbloquear usuario" username={username} />
        </>
      ) : <ActionForm action={action} label="Bloquear usuario" username={username} quiet />}
      <ActionFeedback state={state} />
    </div>
  );
}

function ActionForm({
  action,
  label,
  username,
  quiet = false,
}: {
  action: (formData: FormData) => void;
  label: string;
  username: string;
  quiet?: boolean;
}) {
  return (
    <form action={(formData) => {
      formData.set("username", username);
      return action(formData);
    }}>
      <button className={quiet ? "button button-quiet" : "button button-primary button-small"} type="submit">{label}</button>
    </form>
  );
}

function ActionFeedback({ state }: { state: BlockActionState }) {
  if (state.message) return <p className="form-success relationship-feedback" role="status">{state.message}</p>;
  if (state.errors?.form?.[0]) return <p className="form-error relationship-feedback" role="alert">{state.errors.form[0]}</p>;
  return null;
}
