"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  groupWriteInputFromFormData,
  inviteUsernameFromFormData,
  validateGroupWriteInput,
  validateInviteUsername,
  type GroupCreateFormState,
  type GroupManageFormState,
  type GroupMembershipFormState,
} from "@domain/groups";
import { getCurrentUser } from "@/server/auth/session";
import {
  acceptGroupInvitation,
  approveGroupMember,
  createGroup,
  declineGroupInvitation,
  inviteGroupMember,
  joinGroup,
  leaveGroup,
  rejectGroupMember,
  setOwnGroupCatalogVisible,
  setOwnGroupMembershipApprovalRequired,
  updateOwnGroup,
} from "@/server/groups/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createGroupAction(
  _previous: GroupCreateFormState,
  formData: FormData,
): Promise<GroupCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un grupo."] } };

  const validation = validateGroupWriteInput(groupWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createGroup(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear grupos.",
          ],
        },
      };
    }
    revalidatePath("/groups");
    redirect(`/groups/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el grupo."] } };
  }
}

export async function updateGroupAction(
  _previous: GroupManageFormState,
  formData: FormData,
): Promise<GroupManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const groupId = typeof formData.get("groupId") === "string" ? String(formData.get("groupId")).trim() : "";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  const validation = validateGroupWriteInput(groupWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnGroup(user.id, groupId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar este grupo."
                : "No se encontró el grupo.",
          ],
        },
      };
    }
    revalidatePath(`/groups/${encodeURIComponent(groupId)}`);
    revalidatePath("/groups");
    revalidatePath("/admin/groups");
    return { success: true, message: "Grupo actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el grupo."] } };
  }
}

export async function setGroupVisibleAction(
  _previous: GroupManageFormState,
  formData: FormData,
): Promise<GroupManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const groupId = typeof formData.get("groupId") === "string" ? String(formData.get("groupId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  try {
    const result = await setOwnGroupCatalogVisible(user.id, groupId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [result.reason === "forbidden" ? "No puedes gestionar este grupo." : "No se encontró el grupo."],
        },
      };
    }
    revalidatePath(`/groups/${encodeURIComponent(groupId)}`);
    revalidatePath("/groups");
    revalidatePath("/admin/groups");
    return {
      success: true,
      message: visible ? "Grupo visible en el catálogo." : "Grupo oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}

export async function joinGroupAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para unirte al grupo."] } };

  const groupId = typeof formData.get("groupId") === "string" ? String(formData.get("groupId")).trim() : "";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  try {
    const result = await joinGroup(user.id, groupId);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "already_member"
              ? "Ya formas parte de este grupo."
              : result.reason === "not_found"
                ? "No se encontró el grupo."
                : "No puedes unirte a este grupo.",
          ],
        },
      };
    }
    revalidatePath(`/groups/${encodeURIComponent(groupId)}`);
    revalidatePath("/groups");
    return {
      success: true,
      message: result.pending
        ? "Solicitud enviada. El propietario debe aprobarla."
        : "Te has unido al grupo.",
    };
  } catch {
    return { errors: { form: ["No se pudo completar la solicitud."] } };
  }
}

export async function leaveGroupAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const groupId = typeof formData.get("groupId") === "string" ? String(formData.get("groupId")).trim() : "";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  try {
    const result = await leaveGroup(user.id, groupId);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "El propietario no puede abandonar el grupo."
              : result.reason === "not_member"
                ? "No eres miembro de este grupo."
                : "No se pudo abandonar el grupo.",
          ],
        },
      };
    }
    revalidatePath(`/groups/${encodeURIComponent(groupId)}`);
    revalidatePath("/groups");
    return { success: true, message: "Has abandonado el grupo." };
  } catch {
    return { errors: { form: ["No se pudo completar la solicitud."] } };
  }
}

function revalidateGroup(groupId: string) {
  revalidatePath(`/groups/${encodeURIComponent(groupId)}`);
  revalidatePath("/groups");
}

export async function approveGroupMemberAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  const memberUserId = String(formData.get("memberUserId") ?? "").trim();
  if (!groupId || !memberUserId) return { errors: { form: ["Solicitud no válida."] } };

  const result = await approveGroupMember(user.id, groupId, memberUserId);
  if (!result.ok) return { errors: { form: ["No se pudo aprobar la solicitud."] } };
  revalidateGroup(groupId);
  return { success: true, message: "Miembro aprobado." };
}

export async function rejectGroupMemberAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  const memberUserId = String(formData.get("memberUserId") ?? "").trim();
  if (!groupId || !memberUserId) return { errors: { form: ["Solicitud no válida."] } };

  const result = await rejectGroupMember(user.id, groupId, memberUserId);
  if (!result.ok) return { errors: { form: ["No se pudo rechazar la solicitud."] } };
  revalidateGroup(groupId);
  return { success: true, message: "Solicitud rechazada." };
}

export async function inviteGroupMemberAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };
  const input = inviteUsernameFromFormData(formData);
  const validationError = validateInviteUsername(input);
  if (validationError) return { errors: validationError };

  const result = await inviteGroupMember(user.id, groupId, input.username);
  if (!result.ok) {
    return {
      errors: {
        form: [
          result.reason === "user_not_found"
            ? "No encontramos ese usuario."
            : result.reason === "already_member"
              ? "Ese usuario ya está en el grupo o tiene una invitación pendiente."
              : "No se pudo enviar la invitación.",
        ],
      },
    };
  }
  revalidateGroup(groupId);
  return { success: true, message: "Invitación enviada." };
}

export async function acceptGroupInvitationAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para aceptar la invitación."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  const result = await acceptGroupInvitation(user.id, groupId);
  if (!result.ok) return { errors: { form: ["Invitación no válida."] } };
  revalidateGroup(groupId);
  return { success: true, message: "Te has unido al grupo." };
}

export async function declineGroupInvitationAction(
  _previous: GroupMembershipFormState,
  formData: FormData,
): Promise<GroupMembershipFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  const result = await declineGroupInvitation(user.id, groupId);
  if (!result.ok) return { errors: { form: ["Invitación no válida."] } };
  revalidateGroup(groupId);
  return { success: true, message: "Invitación rechazada." };
}

export async function setGroupApprovalRequiredAction(
  _previous: GroupManageFormState,
  formData: FormData,
): Promise<GroupManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const groupId = String(formData.get("groupId") ?? "").trim();
  const required = formData.get("required") === "1";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  const result = await setOwnGroupMembershipApprovalRequired(user.id, groupId, required);
  if (!result.ok) return { errors: { form: ["No se pudo actualizar la configuración."] } };
  revalidateGroup(groupId);
  return {
    success: true,
    message: required ? "Las solicitudes requieren aprobación." : "Unión automática activada.",
  };
}
