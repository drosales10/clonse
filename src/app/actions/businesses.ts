"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  businessWriteInputFromFormData,
  validateBusinessWriteInput,
  type BusinessCreateFormState,
  type BusinessManageFormState,
} from "@domain/businesses";
import { getCurrentUser } from "@/server/auth/session";
import {
  createBusiness,
  setOwnBusinessCatalogVisible,
  updateOwnBusiness,
} from "@/server/businesses/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createBusinessAction(
  _previous: BusinessCreateFormState,
  formData: FormData,
): Promise<BusinessCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un negocio."] } };

  const validation = validateBusinessWriteInput(businessWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createBusiness(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear negocios.",
          ],
        },
      };
    }
    revalidatePath("/businesses");
    redirect(`/businesses/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el negocio."] } };
  }
}

export async function updateBusinessAction(
  _previous: BusinessManageFormState,
  formData: FormData,
): Promise<BusinessManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const businessId =
    typeof formData.get("businessId") === "string" ? String(formData.get("businessId")).trim() : "";
  if (!businessId) return { errors: { form: ["Negocio no válido."] } };

  const validation = validateBusinessWriteInput(businessWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnBusiness(user.id, businessId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar este negocio."
                : "No se encontró el negocio.",
          ],
        },
      };
    }
    revalidatePath(`/businesses/${encodeURIComponent(businessId)}`);
    revalidatePath("/businesses");
    revalidatePath("/admin/businesses");
    return { success: true, message: "Negocio actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el negocio."] } };
  }
}

export async function setBusinessVisibleAction(
  _previous: BusinessManageFormState,
  formData: FormData,
): Promise<BusinessManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const businessId =
    typeof formData.get("businessId") === "string" ? String(formData.get("businessId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!businessId) return { errors: { form: ["Negocio no válido."] } };

  try {
    const result = await setOwnBusinessCatalogVisible(user.id, businessId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "No puedes gestionar este negocio."
              : "No se encontró el negocio.",
          ],
        },
      };
    }
    revalidatePath(`/businesses/${encodeURIComponent(businessId)}`);
    revalidatePath("/businesses");
    revalidatePath("/admin/businesses");
    return {
      success: true,
      message: visible ? "Negocio visible en el catálogo." : "Negocio oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
