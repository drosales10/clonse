"use server";

import { redirect } from "next/navigation";

import {
  type AccessFormState,
  loginInputFromFormData,
  registerInputFromFormData,
  safeInternalRedirect,
  validateLogin,
  validateRegistration,
} from "@domain/access";
import {
  authenticateUser,
  createUser,
} from "@/server/auth/store";
import { destroySession, establishSession } from "@/server/auth/session";

export async function loginAction(
  _previousState: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
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

export async function registerAction(
  _previousState: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const input = registerInputFromFormData(formData);
  const validation = validateRegistration(input);
  if (!validation.success) return { errors: validation.errors };

  const result = await createUser(validation.data);
  if (!result.ok) {
    return result.reason === "email_taken"
      ? { errors: { email: ["Ya existe una cuenta con este email."] } }
      : { errors: { username: ["Este nombre de usuario ya está ocupado."] } };
  }

  await establishSession(result.user.id, false);
  redirect("/home?welcome=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
