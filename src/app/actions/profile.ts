"use server";

import { revalidatePath } from "next/cache";

import {
  profileSettingsInputFromFormData,
  type ProfileSettingsFormState,
  validateProfileSettings,
} from "@domain/profile";
import { profileFieldsFromFormData, type ProfileFieldsFormState } from "@domain/profile-fields";
import { updateOwnStatus } from "@/server/activity/service";
import { getCurrentUser } from "@/server/auth/session";
import {
  getOwnProfileFields,
  updateOwnProfileFields,
  updateOwnProfileSettings,
} from "@/server/profile/service";

export type StatusComposerFormState = {
  errors?: { form?: string[]; status?: string[] };
  message?: string;
  success?: boolean;
};

export async function updateStatusAction(
  _previousState: StatusComposerFormState,
  formData: FormData,
): Promise<StatusComposerFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const raw = typeof formData.get("status") === "string" ? String(formData.get("status")).trim() : "";
  if (Array.from(raw).length > 100) {
    return { errors: { status: ["El estado no puede superar los 100 caracteres."] } };
  }

  try {
    const result = await updateOwnStatus(user.id, raw || null);
    if (!result.ok) return { errors: { form: ["No se pudo localizar tu cuenta."] } };

    revalidatePath("/home");
    revalidatePath("/account/profile");
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    return {
      success: true,
      message: raw ? "Tu estado se ha publicado." : "Tu estado se ha eliminado.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar el estado. Inténtalo de nuevo."] } };
  }
}

export async function updateProfileSettingsAction(
  _previousState: ProfileSettingsFormState,
  formData: FormData,
): Promise<ProfileSettingsFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  const validation = validateProfileSettings(profileSettingsInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnProfileSettings(user.id, validation.data);
    if (!result.ok) return { errors: { form: ["No se pudo localizar tu cuenta."] } };

    revalidatePath("/account/profile");
    revalidatePath("/home");
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    return { success: true, message: "Tus ajustes de perfil se han guardado." };
  } catch {
    return { errors: { form: ["No se pudieron guardar los ajustes. Inténtalo de nuevo."] } };
  }
}

export async function updateProfileFieldsAction(
  _previousState: ProfileFieldsFormState,
  formData: FormData,
): Promise<ProfileFieldsFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado. Inicia sesión de nuevo."] } };

  try {
    const fields = await getOwnProfileFields(user.id);
    const validation = profileFieldsFromFormData(formData, fields);
    if (!validation.success) return { errors: validation.errors };

    const result = await updateOwnProfileFields(user.id, validation.values);
    if (!result.ok) {
      return {
        errors: {
          form: [result.reason === "not_found" ? "No se pudo localizar tu cuenta." : "La definición de un campo ya no está disponible."],
        },
      };
    }

    revalidatePath("/account/profile");
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    return { success: true, message: "Tus campos de perfil se han guardado." };
  } catch {
    return { errors: { form: ["No se pudieron guardar los campos. Inténtalo de nuevo."] } };
  }
}
