"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  groupWriteInputFromFormData,
  validateGroupWriteInput,
  type GroupCreateFormState,
  type GroupManageFormState,
} from "@domain/groups";
import { getCurrentUser } from "@/server/auth/session";
import {
  createGroup,
  setOwnGroupCatalogVisible,
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
