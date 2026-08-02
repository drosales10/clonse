"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  blogWriteInputFromFormData,
  validateBlogWriteInput,
  type BlogCreateFormState,
  type BlogManageFormState,
} from "@domain/blogs";
import { getCurrentUser } from "@/server/auth/session";
import {
  createBlogEntry,
  setOwnBlogEntryCatalogVisible,
  updateOwnBlogEntry,
} from "@/server/blogs/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createBlogAction(
  _previous: BlogCreateFormState,
  formData: FormData,
): Promise<BlogCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear una entrada de blog."] } };

  const validation = validateBlogWriteInput(blogWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createBlogEntry(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear entradas de blog.",
          ],
        },
      };
    }
    revalidatePath("/blogs");
    redirect(`/blogs/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear la entrada de blog."] } };
  }
}

export async function updateBlogAction(
  _previous: BlogManageFormState,
  formData: FormData,
): Promise<BlogManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const entryId = typeof formData.get("entryId") === "string" ? String(formData.get("entryId")).trim() : "";
  if (!entryId) return { errors: { form: ["Entrada no válida."] } };

  const validation = validateBlogWriteInput(blogWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnBlogEntry(user.id, entryId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar esta entrada."
                : "No se encontró la entrada.",
          ],
        },
      };
    }
    revalidatePath(`/blogs/${encodeURIComponent(entryId)}`);
    revalidatePath("/blogs");
    revalidatePath("/admin/blogs");
    return { success: true, message: "Entrada actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la entrada."] } };
  }
}

export async function setBlogVisibleAction(
  _previous: BlogManageFormState,
  formData: FormData,
): Promise<BlogManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const entryId = typeof formData.get("entryId") === "string" ? String(formData.get("entryId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!entryId) return { errors: { form: ["Entrada no válida."] } };

  try {
    const result = await setOwnBlogEntryCatalogVisible(user.id, entryId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "No puedes gestionar esta entrada."
              : "No se encontró la entrada.",
          ],
        },
      };
    }
    revalidatePath(`/blogs/${encodeURIComponent(entryId)}`);
    revalidatePath("/blogs");
    revalidatePath("/admin/blogs");
    return {
      success: true,
      message: visible ? "Entrada visible en el catálogo." : "Entrada oculta del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
