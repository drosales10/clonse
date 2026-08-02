"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupMembershipFormState, GroupMembershipState } from "@domain/groups";
import {
  acceptGroupInvitationAction,
  declineGroupInvitationAction,
  joinGroupAction,
  leaveGroupAction,
} from "@/app/actions/groups";

function SubmitButton({ label, quiet = false }: { label: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={quiet ? "button button-quiet button-small" : "button button-primary button-small"}
      disabled={pending}
      type="submit"
    >
      {pending ? "…" : label}
    </button>
  );
}

function Feedback({ state }: { state: GroupMembershipFormState }) {
  if (state.message) {
    return (
      <p className="form-success relationship-feedback" role="status">
        {state.message}
      </p>
    );
  }
  if (state.errors?.form?.[0]) {
    return (
      <p className="form-error relationship-feedback" role="alert">
        {state.errors.form[0]}
      </p>
    );
  }
  return null;
}

export function GroupMembershipActions({
  groupId,
  membership,
  canJoin,
  membershipApprovalRequired,
}: {
  groupId: string;
  membership: GroupMembershipState;
  canJoin: boolean;
  membershipApprovalRequired: boolean;
}) {
  const [joinState, joinAction] = useActionState<GroupMembershipFormState, FormData>(joinGroupAction, {});
  const [leaveState, leaveAction] = useActionState<GroupMembershipFormState, FormData>(leaveGroupAction, {});
  const [acceptState, acceptAction] = useActionState<GroupMembershipFormState, FormData>(
    acceptGroupInvitationAction,
    {},
  );
  const [declineState, declineAction] = useActionState<GroupMembershipFormState, FormData>(
    declineGroupInvitationAction,
    {},
  );

  if (membership === "owner") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Eres el propietario</span>
      </div>
    );
  }

  if (membership === "invited") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Invitación pendiente</span>
        <div className="relationship-button-row">
          <form action={acceptAction}>
            <input name="groupId" type="hidden" value={groupId} />
            <SubmitButton label="Aceptar invitación" />
          </form>
          <form action={declineAction}>
            <input name="groupId" type="hidden" value={groupId} />
            <SubmitButton label="Rechazar" quiet />
          </form>
        </div>
        <Feedback state={acceptState} />
        <Feedback state={declineState} />
      </div>
    );
  }

  if (membership === "pending") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Solicitud pendiente de aprobación</span>
        <form action={leaveAction}>
          <input name="groupId" type="hidden" value={groupId} />
          <SubmitButton label="Cancelar solicitud" quiet />
        </form>
        <Feedback state={leaveState} />
      </div>
    );
  }

  if (membership === "member") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Miembro</span>
        <form action={leaveAction}>
          <input name="groupId" type="hidden" value={groupId} />
          <SubmitButton label="Abandonar grupo" quiet />
        </form>
        <Feedback state={leaveState} />
      </div>
    );
  }

  if (!canJoin) return null;

  return (
    <div className="relationship-actions">
      <form action={joinAction}>
        <input name="groupId" type="hidden" value={groupId} />
        <SubmitButton label={membershipApprovalRequired ? "Solicitar unirse" : "Unirse al grupo"} />
      </form>
      <Feedback state={joinState} />
    </div>
  );
}
