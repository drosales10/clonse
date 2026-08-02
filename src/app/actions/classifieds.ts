"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  classifiedWriteInputFromFormData,
  validateClassifiedWriteInput,
  type ClassifiedCreateFormState,
  type ClassifiedManageFormState,
} from "@domain/classifieds";
import { getCurrentUser } from "@/server/auth/session";
import {
  createClassified,
  setOwnClassifiedCatalogVisible,
  updateOwnClassified,
} from "@/server/classifieds/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createClassifiedAction(
  _previous: ClassifiedCreateFormState,
  formData: FormData,
): Promise<ClassifiedCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un clasificado."] } };

  const validation = validateClassifiedWriteInput(classifiedWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createClassified(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear clasificados.",
          ],
        },
      };
    }
    revalidatePath("/classifieds");
    redirect(`/classifieds/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el clasificado."] } };
  }
}

export async function updateClassifiedAction(
  _previous: ClassifiedManageFormState,
  formData: FormData,
): Promise<ClassifiedManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const classifiedId =
    typeof formData.get("classifiedId") === "string" ? String(formData.get("classifiedId")).trim() : "";
  if (!classifiedId) return { errors: { form: ["Clasificado no válido."] } };

  const validation = validateClassifiedWriteInput(classifiedWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnClassified(user.id, classifiedId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar este clasificado."
                : "No se encontró el clasificado.",
          ],
        },
      };
    }
    revalidatePath(`/classifieds/${encodeURIComponent(classifiedId)}`);
    revalidatePath("/classifieds");
    revalidatePath("/admin/classifieds");
    return { success: true, message: "Clasificado actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el clasificado."] } };
  }
}

export async function setClassifiedVisibleAction(
  _previous: ClassifiedManageFormState,
  formData: FormData,
): Promise<ClassifiedManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const classifiedId =
    typeof formData.get("classifiedId") === "string" ? String(formData.get("classifiedId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!classifiedId) return { errors: { form: ["Clasificado no válido."] } };

  try {
    const result = await setOwnClassifiedCatalogVisible(user.id, classifiedId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "No puedes gestionar este clasificado."
              : "No se encontró el clasificado.",
          ],
        },
      };
    }
    revalidatePath(`/classifieds/${encodeURIComponent(classifiedId)}`);
    revalidatePath("/classifieds");
    revalidatePath("/admin/classifieds");
    return {
      success: true,
      message: visible ? "Clasificado visible en el catálogo." : "Clasificado oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
