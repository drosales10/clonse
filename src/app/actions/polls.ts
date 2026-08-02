"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  pollCreateInputFromFormData,
  pollVoteFromFormData,
  pollWriteInputFromFormData,
  pollOptionsWriteInputFromFormData,
  validatePollCreateInput,
  validatePollVoteInput,
  validatePollWriteInput,
  validatePollOptionsWriteInput,
  type PollCreateFormState,
  type PollManageFormState,
  type PollVoteFormState,
} from "@domain/polls";
import { getCurrentUser } from "@/server/auth/session";
import {
  castPollVote,
  closeOwnPoll,
  createPoll,
  getPollDetail,
  setOwnPollCatalogVisible,
  updateOwnPoll,
  updateOwnPollOptions,
} from "@/server/polls/service";

export async function createPollAction(
  _previousState: PollCreateFormState,
  formData: FormData,
): Promise<PollCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear una encuesta."] } };

  const validation = validatePollCreateInput(pollCreateInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createPoll(user.id, validation.data);
    if (!result.ok) return { errors: { form: ["No tienes permiso para crear encuestas."] } };

    revalidatePath("/polls");
    redirect(`/polls/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear la encuesta. Inténtalo de nuevo."] } };
  }
}

export async function closeOwnPollAction(
  _previousState: PollManageFormState,
  formData: FormData,
): Promise<PollManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const pollId = typeof formData.get("pollId") === "string" ? String(formData.get("pollId")).trim() : "";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  try {
    const result = await closeOwnPoll(user.id, pollId);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "already_closed"
              ? "La encuesta ya estaba cerrada."
              : result.reason === "forbidden"
                ? "No puedes cerrar esta encuesta."
                : "No se encontró la encuesta.",
          ],
        },
      };
    }

    revalidatePath(`/polls/${encodeURIComponent(pollId)}`);
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return { success: true, message: "Encuesta cerrada." };
  } catch {
    return { errors: { form: ["No se pudo cerrar la encuesta."] } };
  }
}

export async function updatePollAction(
  _previous: PollManageFormState,
  formData: FormData,
): Promise<PollManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const pollId = typeof formData.get("pollId") === "string" ? String(formData.get("pollId")).trim() : "";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  const validation = validatePollWriteInput(pollWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnPoll(user.id, pollId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [result.reason === "forbidden" ? "No puedes editar esta encuesta." : "No se encontró la encuesta."],
        },
      };
    }
    revalidatePath(`/polls/${encodeURIComponent(pollId)}`);
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return { success: true, message: "Encuesta actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la encuesta."] } };
  }
}

export async function setPollVisibleAction(
  _previous: PollManageFormState,
  formData: FormData,
): Promise<PollManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const pollId = typeof formData.get("pollId") === "string" ? String(formData.get("pollId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  try {
    const result = await setOwnPollCatalogVisible(user.id, pollId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [result.reason === "forbidden" ? "No puedes gestionar esta encuesta." : "No se encontró la encuesta."],
        },
      };
    }
    revalidatePath(`/polls/${encodeURIComponent(pollId)}`);
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return {
      success: true,
      message: visible ? "Encuesta visible en el catálogo." : "Encuesta oculta del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}

export async function updatePollOptionsAction(
  _previous: PollManageFormState,
  formData: FormData,
): Promise<PollManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const pollId = typeof formData.get("pollId") === "string" ? String(formData.get("pollId")).trim() : "";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  const validation = validatePollOptionsWriteInput(pollOptionsWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnPollOptions(user.id, pollId, validation.data.options);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "has_votes"
              ? "No puedes editar las opciones después de recibir votos."
              : result.reason === "closed"
                ? "La encuesta está cerrada."
                : result.reason === "forbidden"
                  ? "No puedes editar esta encuesta."
                  : "No se encontró la encuesta.",
          ],
        },
      };
    }
    revalidatePath(`/polls/${encodeURIComponent(pollId)}`);
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return { success: true, message: "Opciones actualizadas." };
  } catch {
    return { errors: { form: ["No se pudieron actualizar las opciones."] } };
  }
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function votePollAction(
  _previousState: PollVoteFormState,
  formData: FormData,
): Promise<PollVoteFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para votar en esta encuesta."] } };

  const { pollId, optionIndex } = pollVoteFromFormData(formData);
  const detail = await getPollDetail(user.id, pollId);
  if (!detail) return { errors: { form: ["No encontramos esta encuesta."] } };

  const validationError = validatePollVoteInput(pollId, optionIndex, detail.options.length);
  if (validationError) return { errors: validationError };

  try {
    const result = await castPollVote(user.id, pollId, optionIndex as number);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "closed"
              ? "Esta encuesta está cerrada."
              : result.reason === "already_voted"
                ? "Ya has votado en esta encuesta."
                : result.reason === "invalid_option"
                  ? "Selecciona una opción válida."
                  : "No se pudo registrar el voto.",
          ],
        },
      };
    }

    revalidatePath(`/polls/${encodeURIComponent(pollId)}`);
    revalidatePath("/polls");
    return { success: true, message: "Tu voto se ha registrado." };
  } catch {
    return { errors: { form: ["No se pudo registrar el voto. Inténtalo de nuevo."] } };
  }
}
