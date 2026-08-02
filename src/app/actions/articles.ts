"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  articleWriteInputFromFormData,
  validateArticleWriteInput,
  type ArticleCreateFormState,
  type ArticleManageFormState,
} from "@domain/articles";
import { getCurrentUser } from "@/server/auth/session";
import {
  createArticle,
  setOwnArticleCatalogVisible,
  updateOwnArticle,
} from "@/server/articles/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createArticleAction(
  _previous: ArticleCreateFormState,
  formData: FormData,
): Promise<ArticleCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un artículo."] } };

  const validation = validateArticleWriteInput(articleWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createArticle(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear artículos.",
          ],
        },
      };
    }
    revalidatePath("/articles");
    redirect(`/articles/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el artículo."] } };
  }
}

export async function updateArticleAction(
  _previous: ArticleManageFormState,
  formData: FormData,
): Promise<ArticleManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const articleId =
    typeof formData.get("articleId") === "string" ? String(formData.get("articleId")).trim() : "";
  if (!articleId) return { errors: { form: ["Artículo no válido."] } };

  const validation = validateArticleWriteInput(articleWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnArticle(user.id, articleId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar este artículo."
                : "No se encontró el artículo.",
          ],
        },
      };
    }
    revalidatePath(`/articles/${encodeURIComponent(articleId)}`);
    revalidatePath("/articles");
    revalidatePath("/admin/articles");
    return { success: true, message: "Artículo actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el artículo."] } };
  }
}

export async function setArticleVisibleAction(
  _previous: ArticleManageFormState,
  formData: FormData,
): Promise<ArticleManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const articleId =
    typeof formData.get("articleId") === "string" ? String(formData.get("articleId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!articleId) return { errors: { form: ["Artículo no válido."] } };

  try {
    const result = await setOwnArticleCatalogVisible(user.id, articleId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "No puedes gestionar este artículo."
              : "No se encontró el artículo.",
          ],
        },
      };
    }
    revalidatePath(`/articles/${encodeURIComponent(articleId)}`);
    revalidatePath("/articles");
    revalidatePath("/admin/articles");
    return {
      success: true,
      message: visible ? "Artículo visible en el catálogo." : "Artículo oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
