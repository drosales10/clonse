"use server";

import { revalidatePath } from "next/cache";

import {
  blockTargetFromFormData,
  type BlockActionState,
  validateBlockTarget,
} from "@domain/blocks";
import { getCurrentUser } from "@/server/auth/session";
import { blockUser, unblockUser, type BlockMutationFailure } from "@/server/profile/service";

export async function blockUserAction(
  _previousState: BlockActionState,
  formData: FormData,
): Promise<BlockActionState> {
  return executeBlockAction(formData, blockUser, "El usuario se ha bloqueado.");
}

export async function unblockUserAction(
  _previousState: BlockActionState,
  formData: FormData,
): Promise<BlockActionState> {
  return executeBlockAction(formData, unblockUser, "El usuario se ha desbloqueado.");
}

async function executeBlockAction(
  formData: FormData,
  mutation: (actorId: string, targetUsername: string) => ReturnType<typeof blockUser>,
  successMessage: string,
): Promise<BlockActionState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const targetUsername = blockTargetFromFormData(formData);
  const validationError = validateBlockTarget(targetUsername);
  if (validationError) return { errors: { form: [validationError] } };

  try {
    const result = await mutation(user.id, targetUsername);
    if (!result.ok) return { errors: { form: [blockMutationError(result)] } };

    revalidatePath("/account/blocks");
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    revalidatePath(`/profile/${encodeURIComponent(targetUsername)}`);
    revalidatePath("/account/friends");
    return { success: true, message: successMessage };
  } catch {
    return { errors: { form: ["No se pudo actualizar el bloqueo. Inténtalo de nuevo."] } };
  }
}

function blockMutationError(result: BlockMutationFailure): string {
  switch (result.reason) {
    case "target_not_found": return "No se encontró un usuario activo con ese nombre.";
    case "self": return "No puedes bloquear tu propia cuenta.";
    case "already_blocked": return "Este usuario ya está bloqueado.";
    case "not_allowed": return "El bloqueo ya no está disponible para esta cuenta.";
  }
}
