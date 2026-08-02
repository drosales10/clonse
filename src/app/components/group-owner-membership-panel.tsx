"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { GroupMembershipFormState, PublicGroupPendingMember } from "@domain/groups";
import {
  approveGroupMemberAction,
  inviteGroupMemberAction,
  rejectGroupMemberAction,
} from "@/app/actions/groups";

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary button-small" disabled={pending} type="submit">
      {pending ? "Enviando…" : "Invitar"}
    </button>
  );
}

function PendingActionButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-quiet button-small" disabled={pending} type="submit">
      {pending ? "…" : label}
    </button>
  );
}

export function GroupOwnerMembershipPanel({
  groupId,
  pendingMembers,
}: {
  groupId: string;
  pendingMembers: PublicGroupPendingMember[];
}) {
  const [inviteState, inviteAction] = useActionState<GroupMembershipFormState, FormData>(
    inviteGroupMemberAction,
    {},
  );

  return (
    <section className="owner-manage-panel" aria-label="Gestión de miembros">
      <h2>Miembros e invitaciones</h2>
      <form action={inviteAction} className="settings-form catalog-write-form">
        <input name="groupId" type="hidden" value={groupId} />
        <div className="field">
          <label htmlFor="invite-group-username">Invitar por usuario</label>
          <input id="invite-group-username" maxLength={64} name="username" required type="text" />
          {inviteState.errors?.username?.[0] ? (
            <p className="field-error" role="alert">
              {inviteState.errors.username[0]}
            </p>
          ) : null}
        </div>
        {inviteState.errors?.form?.[0] ? (
          <p className="form-error" role="alert">
            {inviteState.errors.form[0]}
          </p>
        ) : null}
        {inviteState.message ? (
          <p className="form-success" role="status">
            {inviteState.message}
          </p>
        ) : null}
        <InviteButton />
      </form>

      {pendingMembers.length > 0 ? (
        <div className="membership-pending-list">
          <h3>Solicitudes pendientes</h3>
          <ul>
            {pendingMembers.map((member) => (
              <li key={member.userId}>
                <span>
                  {member.user.displayName} (@{member.user.username})
                </span>
                <div className="membership-pending-actions">
                  <PendingMemberForm action={approveGroupMemberAction} groupId={groupId} label="Aprobar" memberUserId={member.userId} />
                  <PendingMemberForm action={rejectGroupMemberAction} groupId={groupId} label="Rechazar" memberUserId={member.userId} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="field-help">No hay solicitudes pendientes.</p>
      )}
    </section>
  );
}

function PendingMemberForm({
  action,
  groupId,
  memberUserId,
  label,
}: {
  action: (_previous: GroupMembershipFormState, formData: FormData) => Promise<GroupMembershipFormState>;
  groupId: string;
  memberUserId: string;
  label: string;
}) {
  const [, formAction] = useActionState(action, {});
  return (
    <form action={formAction}>
      <input name="groupId" type="hidden" value={groupId} />
      <input name="memberUserId" type="hidden" value={memberUserId} />
      <PendingActionButton label={label} />
    </form>
  );
}
