"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminLoginInputFromFormData,
  type AdminLoginFormState,
  validateAdminLogin,
} from "@domain/admin-access";
import { requireAdminAccess } from "@/server/admin/access";
import { setAdminAlbumCatalogVisible } from "@/server/admin/album-mutations";
import { setAdminEventCatalogVisible } from "@/server/admin/event-mutations";
import { setAdminGroupCatalogVisible } from "@/server/admin/group-mutations";
import { setAdminPollClosed, setAdminPollCatalogVisible } from "@/server/admin/poll-mutations";
import { destroyAdminSession, establishAdminSession, authenticateAdmin } from "@/server/admin/session";
import { setAdminUserEnabled, setAdminUserVerified } from "@/server/admin/user-mutations";

export type AdminActionState = {
  errors?: { form?: string[] };
  message?: string;
  success?: boolean;
};

export async function adminLoginAction(
  _previousState: AdminLoginFormState,
  formData: FormData,
): Promise<AdminLoginFormState> {
  const input = adminLoginInputFromFormData(formData);
  const validation = validateAdminLogin(input);
  if (!validation.success) return { errors: validation.errors };

  const result = await authenticateAdmin(validation.data.username, validation.data.password);
  if (!result.ok) {
    return {
      message:
        result.reason === "disabled"
          ? "Esta cuenta administrativa está deshabilitada."
          : "El usuario o la contraseña no son válidos.",
    };
  }

  await establishAdminSession(result.admin.id, validation.data.persistent);
  redirect("/admin/dashboard");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function adminSetUserEnabledAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const userId = String(formData.get("userId") ?? "").trim();
  const enabled = formData.get("enabled") === "1";
  if (!userId) return { errors: { form: ["Usuario no válido."] } };

  try {
    const result = await setAdminUserEnabled(userId, enabled);
    if (!result.ok) return { errors: { form: ["No se encontró el usuario."] } };
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: enabled ? "Usuario habilitado." : "Usuario deshabilitado y sesiones cerradas.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar el estado del usuario."] } };
  }
}

export async function adminSetUserVerifiedAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const userId = String(formData.get("userId") ?? "").trim();
  const verified = formData.get("verified") === "1";
  if (!userId) return { errors: { form: ["Usuario no válido."] } };

  try {
    const result = await setAdminUserVerified(userId, verified);
    if (!result.ok) return { errors: { form: ["No se encontró el usuario."] } };
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: verified ? "Email marcado como verificado." : "Verificación de email retirada.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la verificación."] } };
  }
}

export async function adminSetPollClosedAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const pollId = String(formData.get("pollId") ?? "").trim();
  const closed = formData.get("closed") === "1";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  try {
    const result = await setAdminPollClosed(pollId, closed);
    if (!result.ok) return { errors: { form: ["No se encontró la encuesta."] } };
    revalidatePath("/admin/polls");
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    return { success: true, message: closed ? "Encuesta cerrada." : "Encuesta reabierta." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la encuesta."] } };
  }
}

export async function adminSetPollVisibleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const pollId = String(formData.get("pollId") ?? "").trim();
  const visible = formData.get("visible") === "1";
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  try {
    const result = await setAdminPollCatalogVisible(pollId, visible);
    if (!result.ok) return { errors: { form: ["No se encontró la encuesta."] } };
    revalidatePath("/admin/polls");
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    return {
      success: true,
      message: visible ? "Encuesta visible en catálogo." : "Encuesta oculta del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}

export async function adminSetAlbumVisibleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const albumId = String(formData.get("albumId") ?? "").trim();
  const visible = formData.get("visible") === "1";
  if (!albumId) return { errors: { form: ["Álbum no válido."] } };

  try {
    const result = await setAdminAlbumCatalogVisible(albumId, visible);
    if (!result.ok) return { errors: { form: ["No se encontró el álbum."] } };
    revalidatePath("/admin/albums");
    revalidatePath("/albums");
    revalidatePath(`/albums/${albumId}`);
    return {
      success: true,
      message: visible ? "Álbum visible en catálogo." : "Álbum oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}

export async function adminSetGroupVisibleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const visible = formData.get("visible") === "1";
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  try {
    const result = await setAdminGroupCatalogVisible(groupId, visible);
    if (!result.ok) return { errors: { form: ["No se encontró el grupo."] } };
    revalidatePath("/admin/groups");
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return {
      success: true,
      message: visible ? "Grupo visible en catálogo." : "Grupo oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}

export async function adminSetEventVisibleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminAccess();
  const eventId = String(formData.get("eventId") ?? "").trim();
  const visible = formData.get("visible") === "1";
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  try {
    const result = await setAdminEventCatalogVisible(eventId, visible);
    if (!result.ok) return { errors: { form: ["No se encontró el evento."] } };
    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return {
      success: true,
      message: visible ? "Evento visible en catálogo." : "Evento oculto del catálogo.",
    };
  } catch {
    return { errors: { form: ["No se pudo actualizar la visibilidad."] } };
  }
}
