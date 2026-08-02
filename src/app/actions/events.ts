"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  eventWriteInputFromFormData,
  validateEventWriteInput,
  type EventCreateFormState,
  type EventManageFormState,
} from "@domain/events";
import { getCurrentUser } from "@/server/auth/session";
import {
  createEvent,
  setOwnEventCatalogVisible,
  updateOwnEvent,
} from "@/server/events/service";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createEventAction(
  _previous: EventCreateFormState,
  formData: FormData,
): Promise<EventCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un evento."] } };

  const validation = validateEventWriteInput(eventWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createEvent(user.id, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : "No tienes permiso para crear eventos.",
          ],
        },
      };
    }
    revalidatePath("/events");
    redirect(`/events/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el evento."] } };
  }
}

export async function updateEventAction(
  _previous: EventManageFormState,
  formData: FormData,
): Promise<EventManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const eventId = typeof formData.get("eventId") === "string" ? String(formData.get("eventId")).trim() : "";
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  const validation = validateEventWriteInput(eventWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateOwnEvent(user.id, eventId, validation.data);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "invalid_category"
              ? "La categoría seleccionada no es válida."
              : result.reason === "forbidden"
                ? "No puedes editar este evento."
                : "No se encontró el evento.",
          ],
        },
      };
    }
    revalidatePath(`/events/${encodeURIComponent(eventId)}`);
    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { success: true, message: "Evento actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el evento."] } };
  }
}

export async function setEventVisibleAction(
  _previous: EventManageFormState,
  formData: FormData,
): Promise<EventManageFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const eventId = typeof formData.get("eventId") === "string" ? String(formData.get("eventId")).trim() : "";
  const visible = formData.get("visible") === "1";
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  try {
    const result = await setOwnEventCatalogVisible(user.id, eventId, visible);
    if (!result.ok) {
      return {
        errors: {
          form: [result.reason === "forbidden" ? "No puedes gestionar este evento." : "No se encontró el evento."],
        },
      };
    }
    revalidatePath(`/events/${encodeURIComponent(eventId)}`);
    revalidatePath("/events");
    revalidatePath("/admin/events");
    return {
      success: true,
      message: visible ? "Evento visible en el catálogo." : "Evento oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
