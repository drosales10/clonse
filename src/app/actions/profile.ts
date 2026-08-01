"use server";

import { revalidatePath } from "next/cache";

import {
  profileSettingsInputFromFormData,
  type ProfileSettingsFormState,
  validateProfileSettings,
} from "@domain/profile";
import { profileFieldsFromFormData, type ProfileFieldsFormState } from "@domain/profile-fields";
import { getCurrentUser } from "@/server/auth/session";
import {
  getOwnProfileFields,
  updateOwnProfileFields,
  updateOwnProfileSettings,
} from "@/server/profile/service";

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
