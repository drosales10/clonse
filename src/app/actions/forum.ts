"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  forumReplyInputFromFormData,
  forumTopicInputFromFormData,
  validateForumReplyInput,
  validateForumTopicInput,
  type ForumReplyFormState,
  type ForumTopicCreateFormState,
} from "@domain/forum";
import { getCurrentUser } from "@/server/auth/session";
import { createForumReply, createForumTopic } from "@/server/forum/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createForumTopicAction(
  _previous: ForumTopicCreateFormState,
  formData: FormData,
): Promise<ForumTopicCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para publicar un tema."] } };

  const instanceId = typeof formData.get("instanceId") === "string" ? String(formData.get("instanceId")).trim() : "";
  const categoryId = typeof formData.get("categoryId") === "string" ? String(formData.get("categoryId")).trim() : "";
  if (!instanceId || !categoryId) return { errors: { form: ["Categoría no válida."] } };

  const validation = validateForumTopicInput(forumTopicInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createForumTopic(user.id, instanceId, categoryId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "locked"
              ? "Esta categoría está bloqueada."
              : result.reason === "invalid_category"
                ? "Solo puedes publicar en subcategorías públicas."
                : "No se pudo crear el tema.",
          ],
        },
      };
    }

    revalidatePath(`/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(categoryId)}`);
    redirect(
      `/forum/${encodeURIComponent(instanceId)}/topics/${encodeURIComponent(result.id)}?${new URLSearchParams({ categoryId }).toString()}`,
    );
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el tema."] } };
  }
}

export async function createForumReplyAction(
  _previous: ForumReplyFormState,
  formData: FormData,
): Promise<ForumReplyFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para responder."] } };

  const instanceId = typeof formData.get("instanceId") === "string" ? String(formData.get("instanceId")).trim() : "";
  const categoryId = typeof formData.get("categoryId") === "string" ? String(formData.get("categoryId")).trim() : "";
  const topicId = typeof formData.get("topicId") === "string" ? String(formData.get("topicId")).trim() : "";
  if (!instanceId || !categoryId || !topicId) return { errors: { form: ["Tema no válido."] } };

  const validation = validateForumReplyInput(forumReplyInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createForumReply(user.id, instanceId, categoryId, topicId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "locked"
              ? "Esta categoría está bloqueada."
              : result.reason === "topic_locked"
                ? "Este tema está bloqueado."
                : "No se pudo publicar la respuesta.",
          ],
        },
      };
    }

    const topicPath = `/forum/${encodeURIComponent(instanceId)}/topics/${encodeURIComponent(topicId)}`;
    revalidatePath(topicPath);
    revalidatePath(`/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(categoryId)}`);
    return { success: true, message: "Respuesta publicada." };
  } catch {
    return { errors: { form: ["No se pudo publicar la respuesta."] } };
  }
}
