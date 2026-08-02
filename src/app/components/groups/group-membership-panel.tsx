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
      className={quiet ? "groups-btn groups-btn-secondary" : "groups-btn groups-btn-primary"}
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
      <p className="groups-form-success" role="status">
        {state.message}
      </p>
    );
  }
  if (state.errors?.form?.[0]) {
    return (
      <p className="groups-form-error" role="alert">
        {state.errors.form[0]}
      </p>
    );
  }
  return null;
}

export function GroupMembershipPanel({
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
      <section aria-labelledby="group-membership-title" className="groups-membership-section">
        <h2 id="group-membership-title">Membresía</h2>
        <p className="groups-membership-status">Eres el propietario de este grupo.</p>
      </section>
    );
  }

  if (membership === "invited") {
    return (
      <section aria-labelledby="group-membership-title" className="groups-membership-section">
        <h2 id="group-membership-title">Membresía</h2>
        <p className="groups-membership-status">Invitación pendiente</p>
        <div className="groups-form-actions">
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
      </section>
    );
  }

  if (membership === "pending") {
    return (
      <section aria-labelledby="group-membership-title" className="groups-membership-section">
        <h2 id="group-membership-title">Membresía</h2>
        <p className="groups-membership-status">Solicitud pendiente de aprobación</p>
        <form action={leaveAction}>
          <input name="groupId" type="hidden" value={groupId} />
          <SubmitButton label="Cancelar solicitud" quiet />
        </form>
        <Feedback state={leaveState} />
      </section>
    );
  }

  if (membership === "member") {
    return (
      <section aria-labelledby="group-membership-title" className="groups-membership-section">
        <h2 id="group-membership-title">Membresía</h2>
        <p className="groups-membership-status">Eres miembro de este grupo</p>
        <form action={leaveAction}>
          <input name="groupId" type="hidden" value={groupId} />
          <SubmitButton label="Abandonar grupo" quiet />
        </form>
        <Feedback state={leaveState} />
      </section>
    );
  }

  if (!canJoin) return null;

  return (
    <section aria-labelledby="group-membership-title" className="groups-membership-section">
      <h2 id="group-membership-title">Membresía</h2>
      <form action={joinAction}>
        <input name="groupId" type="hidden" value={groupId} />
        <SubmitButton label={membershipApprovalRequired ? "Solicitar unirse" : "Unirse al grupo"} />
      </form>
      <Feedback state={joinState} />
    </section>
  );
}
