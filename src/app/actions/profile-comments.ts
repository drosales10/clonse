"use server";

import { revalidatePath } from "next/cache";

import {
  profileCommentBodyFromFormData,
  type ProfileCommentFormState,
  validateProfileCommentBody,
} from "@domain/profile-comments";
import { getCurrentUser } from "@/server/auth/session";
import {
  createProfileCommentWithNotification,
  deleteProfileComment,
  updateProfileComment,
} from "@/server/profile-comments/service";

export async function createProfileCommentAction(
  _previousState: ProfileCommentFormState,
  formData: FormData,
): Promise<ProfileCommentFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const ownerUsername = formValue(formData, "ownerUsername");
  const validation = validateProfileCommentBody(profileCommentBodyFromFormData(formData));
  if (!ownerUsername) return { errors: { form: ["No se pudo localizar el perfil."] } };
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createProfileCommentWithNotification(user.id, ownerUsername, validation.body);
    if (!result.ok) return { errors: { form: commentMutationError(result.reason) } };
    revalidateProfile(ownerUsername);
    return { success: true, message: "Comentario publicado." };
  } catch {
    return { errors: { form: ["No se pudo publicar el comentario. Inténtalo de nuevo."] } };
  }
}

export async function updateProfileCommentAction(
  _previousState: ProfileCommentFormState,
  formData: FormData,
): Promise<ProfileCommentFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const ownerUsername = formValue(formData, "ownerUsername");
  const commentId = formValue(formData, "commentId");
  const validation = validateProfileCommentBody(profileCommentBodyFromFormData(formData));
  if (!ownerUsername || !commentId) return { errors: { form: ["No se pudo localizar el comentario."] } };
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateProfileComment(user.id, ownerUsername, commentId, validation.body);
    if (!result.ok) return { errors: { form: commentMutationError(result.reason) } };
    revalidateProfile(ownerUsername);
    return { success: true, message: "Comentario actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el comentario. Inténtalo de nuevo."] } };
  }
}

export async function deleteProfileCommentAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const ownerUsername = formValue(formData, "ownerUsername");
  const commentId = formValue(formData, "commentId");
  if (!ownerUsername || !commentId) return;

  const result = await deleteProfileComment(user.id, ownerUsername, commentId);
  if (result.ok) revalidateProfile(ownerUsername);
}

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function commentMutationError(reason: "not_found" | "not_allowed" | "invalid_comment"): string[] {
  if (reason === "not_found") return ["No se pudo localizar el perfil o comentario."];
  if (reason === "invalid_comment") return ["El comentario no es válido."];
  return ["No tienes permiso para modificar este comentario."];
}

function revalidateProfile(username: string): void {
  revalidatePath(`/profile/${encodeURIComponent(username)}`);
}
