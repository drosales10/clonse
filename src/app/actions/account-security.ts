"use server";

import { redirect } from "next/navigation";

import {
  currentPasswordFromFormData,
  deleteConfirmationFromFormData,
  passwordPairFromFormData,
  type AccessFormState,
  validateDeleteConfirmation,
  validatePasswordPair,
} from "@domain/access";
import { destroySession, getCurrentSessionToken, getCurrentUser } from "@/server/auth/session";
import { changeUserPassword, deleteUserAccount } from "@/server/auth/store";

export async function changePasswordAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const currentPassword = currentPasswordFromFormData(formData);
  const passwords = passwordPairFromFormData(formData);
  if (!currentPassword) return { errors: { currentPassword: ["Introduce tu contraseña actual."] } };
  const validation = validatePasswordPair(passwords.password, passwords.passwordConfirmation);
  if (!validation.success) return { errors: validation.errors };

  const result = await changeUserPassword(user.id, currentPassword, validation.data.password, await getCurrentSessionToken());
  if (!result.ok) {
    return { errors: { form: [result.reason === "invalid_current" ? "La contraseña actual no es correcta." : "No se pudo localizar tu cuenta."] } };
  }
  return { success: true, message: "Tu contraseña se ha actualizado. Las demás sesiones fueron cerradas." };
}

export async function deleteAccountAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const currentPassword = currentPasswordFromFormData(formData);
  if (!currentPassword) return { errors: { currentPassword: ["Introduce tu contraseña actual."] } };
  const confirmation = validateDeleteConfirmation(deleteConfirmationFromFormData(formData));
  if (!confirmation.success) return { errors: confirmation.errors };

  const result = await deleteUserAccount(user.id, currentPassword);
  if (!result.ok) {
    return { errors: { form: [result.reason === "invalid_current" ? "La contraseña actual no es correcta." : "No se pudo localizar tu cuenta."] } };
  }
  await destroySession();
  redirect("/");
}
