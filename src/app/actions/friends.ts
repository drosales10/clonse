"use server";

import { revalidatePath } from "next/cache";

import {
  friendTargetFromFormData,
  type FriendActionState,
  validateFriendTarget,
} from "@domain/friends";
import { getCurrentUser } from "@/server/auth/session";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendMutationResult,
} from "@/server/profile/service";

export async function sendFriendRequestAction(
  _previousState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  return executeFriendAction(formData, sendFriendRequest, "La solicitud de conexión se ha enviado.");
}

export async function acceptFriendRequestAction(
  _previousState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  return executeFriendAction(formData, acceptFriendRequest, "La conexión se ha aceptado.");
}

export async function rejectFriendRequestAction(
  _previousState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  return executeFriendAction(formData, rejectFriendRequest, "La solicitud se ha rechazado.");
}

export async function cancelFriendRequestAction(
  _previousState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  return executeFriendAction(formData, cancelFriendRequest, "La solicitud se ha cancelado.");
}

export async function removeFriendAction(
  _previousState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  return executeFriendAction(formData, removeFriend, "La conexión se ha eliminado.");
}

async function executeFriendAction(
  formData: FormData,
  mutation: (actorId: string, targetUsername: string) => Promise<FriendMutationResult>,
  successMessage: string,
): Promise<FriendActionState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const targetUsername = friendTargetFromFormData(formData);
  const validationError = validateFriendTarget(targetUsername);
  if (validationError) return { errors: { form: [validationError] } };

  try {
    const result = await mutation(user.id, targetUsername);
    if (!result.ok) return { errors: { form: [friendMutationError(result.reason)] } };

    revalidatePath("/account/friends");
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    revalidatePath(`/profile/${encodeURIComponent(targetUsername)}`);
    return { success: true, message: successMessage };
  } catch {
    return { errors: { form: ["No se pudo actualizar la conexión. Inténtalo de nuevo."] } };
  }
}

function friendMutationError(reason: Exclude<FriendMutationResult, { ok: true }>["reason"]): string {
  switch (reason) {
    case "target_not_found": return "No se encontró un usuario activo con ese nombre.";
    case "self": return "No puedes enviar una solicitud a tu propia cuenta.";
    case "already_friends": return "Ya existe una conexión con este usuario.";
    case "already_pending": return "Ya existe una solicitud pendiente entre estas cuentas.";
    case "not_allowed": return "La solicitud ya no está disponible para esta cuenta.";
  }
}
