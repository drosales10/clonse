"use client";

import { useActionState } from "react";

import type { FriendActionState, FriendRelationship } from "@domain/friends";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";

export function FriendRelationshipActions({
  relationship,
  username,
}: {
  relationship: FriendRelationship;
  username: string;
}) {
  const [sendState, sendAction] = useActionState<FriendActionState, FormData>(sendFriendRequestAction, {});
  const [acceptState, acceptAction] = useActionState<FriendActionState, FormData>(acceptFriendRequestAction, {});
  const [rejectState, rejectAction] = useActionState<FriendActionState, FormData>(rejectFriendRequestAction, {});
  const [cancelState, cancelAction] = useActionState<FriendActionState, FormData>(cancelFriendRequestAction, {});
  const [removeState, removeAction] = useActionState<FriendActionState, FormData>(removeFriendAction, {});

  if (relationship === "self") return null;

  if (relationship === "friends") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Conectados</span>
        <ActionForm action={removeAction} label="Eliminar conexión" quiet />
        <ActionFeedback state={removeState} />
      </div>
    );
  }

  if (relationship === "incoming_pending") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Solicitud pendiente</span>
        <div className="relationship-button-row">
          <ActionForm action={acceptAction} label="Aceptar" />
          <ActionForm action={rejectAction} label="Rechazar" quiet />
        </div>
        <ActionFeedback state={acceptState} />
        <ActionFeedback state={rejectState} />
      </div>
    );
  }

  if (relationship === "outgoing_pending") {
    return (
      <div className="relationship-actions">
        <span className="relationship-status">Solicitud enviada</span>
        <ActionForm action={cancelAction} label="Cancelar solicitud" quiet />
        <ActionFeedback state={cancelState} />
      </div>
    );
  }

  return (
    <div className="relationship-actions">
      <ActionForm action={sendAction} label="Añadir a conexiones" />
      <ActionFeedback state={sendState} />
    </div>
  );

  function withTarget(formData: FormData): FormData {
    formData.set("username", username);
    return formData;
  }

  function ActionForm({
    action,
    label,
    quiet = false,
  }: {
    action: (formData: FormData) => void;
    label: string;
    quiet?: boolean;
  }) {
    return (
      <form action={(formData) => action(withTarget(formData))}>
        <button className={quiet ? "button button-quiet" : "button button-primary button-small"} type="submit">{label}</button>
      </form>
    );
  }
}

function ActionFeedback({ state }: { state: FriendActionState }) {
  if (state.message) return <p className="form-success relationship-feedback" role="status">{state.message}</p>;
  if (state.errors?.form?.[0]) return <p className="form-error relationship-feedback" role="alert">{state.errors.form[0]}</p>;
  return null;
}
