"use server";

import { redirect } from "next/navigation";

import {
  type AccessFormState,
  currentPasswordFromFormData,
  deleteConfirmationFromFormData,
  emailFromFormData,
  loginInputFromFormData,
  passwordPairFromFormData,
  registerInputFromFormData,
  safeInternalRedirect,
  tokenFromFormData,
  validateEmail,
  validateLogin,
  validatePasswordPair,
  validateRegistration,
  validateDeleteConfirmation,
} from "@domain/access";
import { destroySession, establishSession, getCurrentSessionToken, getCurrentUser } from "@/server/auth/session";
import {
  authenticateUser,
  changeUserPassword,
  createUser,
  deleteUserAccount,
  requestPasswordReset,
  resendVerification,
  resetUserPassword,
  verifyUserEmail,
} from "@/server/auth/store";

function developmentLink(path: string): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

function tokenLink(path: string, token: string): string | undefined {
  return developmentLink(`${path}?token=${encodeURIComponent(token)}`);
}

export async function loginAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const input = loginInputFromFormData(formData);
  const validation = validateLogin(input);
  if (!validation.success) return { errors: validation.errors };

  const loginResult = await authenticateUser(validation.data);
  if (!loginResult.ok) {
    return {
      message:
        loginResult.reason === "disabled"
          ? "Esta cuenta está deshabilitada."
          : loginResult.reason === "unverified"
            ? "Debes verificar tu email antes de iniciar sesión."
            : "El email o la contraseña no son válidos.",
    };
  }

  await establishSession(loginResult.user.id, input.persistent);
  redirect(safeInternalRedirect(input.returnUrl));
}

export async function registerAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const input = registerInputFromFormData(formData);
  const validation = validateRegistration(input);
  if (!validation.success) return { errors: validation.errors };

  const result = await createUser(validation.data);
  if (!result.ok) {
    return result.reason === "email_taken"
      ? { errors: { email: ["Ya existe una cuenta con este email."] } }
      : { errors: { username: ["Este nombre de usuario ya está ocupado."] } };
  }

  return {
    success: true,
    message: "Cuenta creada. Verifica tu email para activar el acceso.",
    developmentLink: tokenLink("/verify", result.verificationToken),
  };
}

export async function resendVerificationAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const email = emailFromFormData(formData);
  const validation = validateEmail(email);
  if (!validation.success) return { errors: validation.errors };

  const result = await resendVerification(validation.data);
  return {
    success: true,
    message: "Si existe una cuenta pendiente, recibirás un nuevo enlace de verificación.",
    developmentLink: result.verificationToken ? tokenLink("/verify", result.verificationToken) : undefined,
  };
}

export async function verifyEmailAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const token = tokenFromFormData(formData);
  if (!token) return { errors: { token: ["El enlace de verificación no es válido."] } };

  const result = await verifyUserEmail(token);
  if (!result.ok) {
    return { message: result.reason === "expired" ? "El enlace de verificación ha caducado." : "El enlace de verificación no es válido." };
  }
  return { success: true, message: "Email verificado. Ya puedes iniciar sesión." };
}

export async function requestPasswordResetAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const email = emailFromFormData(formData);
  const validation = validateEmail(email);
  if (!validation.success) return { errors: validation.errors };

  const result = await requestPasswordReset(validation.data);
  return {
    success: true,
    message: "Si existe una cuenta con ese email, recibirás instrucciones para restablecer la contraseña.",
    developmentLink: result.resetToken ? tokenLink("/reset-password", result.resetToken) : undefined,
  };
}

export async function resetPasswordAction(_previousState: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const token = tokenFromFormData(formData);
  const passwords = passwordPairFromFormData(formData);
  if (!token) return { errors: { token: ["El enlace de recuperación no es válido."] } };

  const validation = validatePasswordPair(passwords.password, passwords.passwordConfirmation);
  if (!validation.success) return { errors: validation.errors };

  const result = await resetUserPassword(token, passwords.password);
  if (!result.ok) {
    return { message: result.reason === "expired" ? "El enlace de recuperación ha caducado." : "El enlace de recuperación no es válido." };
  }
  return { success: true, message: "Contraseña actualizada. Todas las sesiones anteriores fueron cerradas." };
}

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

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
