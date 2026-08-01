"use server";

import { redirect } from "next/navigation";

import {
  adminLoginInputFromFormData,
  type AdminLoginFormState,
  validateAdminLogin,
} from "@domain/admin-access";
import { destroyAdminSession, establishAdminSession, authenticateAdmin } from "@/server/admin/session";

export async function adminLoginAction(_previousState: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const input = adminLoginInputFromFormData(formData);
  const validation = validateAdminLogin(input);
  if (!validation.success) return { errors: validation.errors };

  const result = await authenticateAdmin(validation.data.username, validation.data.password);
  if (!result.ok) {
    return {
      message: result.reason === "disabled"
        ? "Esta cuenta administrativa está deshabilitada."
        : "El usuario o la contraseña no son válidos.",
    };
  }

  await establishAdminSession(result.admin.id, validation.data.persistent);
  redirect("/admin/dashboard");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
