"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  eventWriteInputFromFormData,
  validateEventWriteInput,
  eventRsvpFromFormData,
  validateEventRsvpInput,
  inviteUsernameFromFormData,
  validateInviteUsername,
  type EventCreateFormState,
  type EventManageFormState,
  type EventRsvpFormState,
  type EventRsvpValue,
} from "@domain/events";
import { getCurrentUser } from "@/server/auth/session";
import {
  acceptEventInvitation,
  createEvent,
  declineEventInvitation,
  inviteEventMember,
  setEventRsvp,
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

export async function setEventRsvpAction(
  _previous: EventRsvpFormState,
  formData: FormData,
): Promise<EventRsvpFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para confirmar asistencia."] } };

  const { eventId, rsvp } = eventRsvpFromFormData(formData);
  const validationError = validateEventRsvpInput(rsvp);
  if (validationError) return { errors: validationError };
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  try {
    const result = await setEventRsvp(user.id, eventId, rsvp as EventRsvpValue);
    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "forbidden"
              ? "Este evento es solo por invitación."
              : result.reason === "not_found"
                ? "No se encontró el evento."
                : "No se pudo registrar tu respuesta.",
          ],
        },
      };
    }
    revalidatePath(`/events/${encodeURIComponent(eventId)}`);
    revalidatePath("/events");
    return { success: true, message: "Tu respuesta se ha guardado." };
  } catch {
    return { errors: { form: ["No se pudo registrar tu respuesta."] } };
  }
}

function revalidateEvent(eventId: string) {
  revalidatePath(`/events/${encodeURIComponent(eventId)}`);
  revalidatePath("/events");
}

export async function inviteEventMemberAction(
  _previous: EventRsvpFormState,
  formData: FormData,
): Promise<EventRsvpFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return { errors: { form: ["Evento no válido."] } };
  const input = inviteUsernameFromFormData(formData);
  const validationError = validateInviteUsername(input);
  if (validationError) return { errors: validationError };

  const result = await inviteEventMember(user.id, eventId, input.username);
  if (!result.ok) {
    return {
      errors: {
        form: [
          result.reason === "user_not_found"
            ? "No encontramos ese usuario."
            : result.reason === "already_member"
              ? "Ese usuario ya está invitado o registrado."
              : "No se pudo enviar la invitación.",
        ],
      },
    };
  }
  revalidateEvent(eventId);
  return { success: true, message: "Invitación enviada." };
}

export async function acceptEventInvitationAction(
  _previous: EventRsvpFormState,
  formData: FormData,
): Promise<EventRsvpFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para aceptar la invitación."] } };
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  const result = await acceptEventInvitation(user.id, eventId);
  if (!result.ok) return { errors: { form: ["Invitación no válida."] } };
  revalidateEvent(eventId);
  return { success: true, message: "Invitación aceptada." };
}

export async function declineEventInvitationAction(
  _previous: EventRsvpFormState,
  formData: FormData,
): Promise<EventRsvpFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  const result = await declineEventInvitation(user.id, eventId);
  if (!result.ok) return { errors: { form: ["Invitación no válida."] } };
  revalidateEvent(eventId);
  return { success: true, message: "Invitación rechazada." };
}
