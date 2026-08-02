"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  catalogFlagsFromFormData,
  checkboxFromFormData,
  ownerUsernameFromFormData,
  validateOwnerUsername,
  type AdminResourceFormState,
} from "@domain/admin-crud";
import {
  languageVariableWriteInputFromFormData,
  levelWriteInputFromFormData,
  settingWriteInputFromFormData,
  subnetworkWriteInputFromFormData,
  validateLanguageVariableWriteInput,
  validateLevelWriteInput,
  validateSettingWriteInput,
  validateSubnetworkWriteInput,
} from "@domain/catalog-admin";
import {
  albumWriteInputFromFormData,
  validateAlbumWriteInput,
} from "@domain/albums";
import {
  articleWriteInputFromFormData,
  validateArticleWriteInput,
} from "@domain/articles";
import {
  blogWriteInputFromFormData,
  validateBlogWriteInput,
} from "@domain/blogs";
import {
  businessWriteInputFromFormData,
  validateBusinessWriteInput,
} from "@domain/businesses";
import {
  classifiedWriteInputFromFormData,
  validateClassifiedWriteInput,
} from "@domain/classifieds";
import {
  eventWriteInputFromFormData,
  validateEventWriteInput,
} from "@domain/events";
import {
  forumTopicInputFromFormData,
  validateForumTopicInput,
} from "@domain/forum";
import {
  groupWriteInputFromFormData,
  validateGroupWriteInput,
} from "@domain/groups";
import {
  pollOptionsWriteInputFromFormData,
  pollWriteInputFromFormData,
  validatePollOptionsWriteInput,
  validatePollWriteInput,
} from "@domain/polls";

import { requireAdminAccess } from "@/server/admin/access";
import {
  createAdminLanguageVariable,
  createAdminLevel,
  createAdminSetting,
  createAdminSubnetwork,
  deleteAdminLanguageVariable,
  deleteAdminLevel,
  deleteAdminSetting,
  deleteAdminSubnetwork,
  updateAdminLanguageVariable,
  updateAdminLevel,
  updateAdminSetting,
  updateAdminSubnetwork,
} from "@/server/admin/catalog-mutations";
import {
  createAdminAlbum,
  createAdminArticle,
  createAdminBlog,
  createAdminBusiness,
  createAdminClassified,
  createAdminEvent,
  createAdminGroup,
  createAdminPoll,
  deleteAdminAlbum,
  deleteAdminArticle,
  deleteAdminBlog,
  deleteAdminBusiness,
  deleteAdminClassified,
  deleteAdminEvent,
  deleteAdminGroup,
  deleteAdminPoll,
  updateAdminAlbum,
  updateAdminArticle,
  updateAdminBlog,
  updateAdminBusiness,
  updateAdminClassified,
  updateAdminEvent,
  updateAdminGroup,
  updateAdminPoll,
} from "@/server/admin/content-crud";
import {
  deleteAdminForumCategory,
  deleteAdminForumTopic,
  updateAdminForumCategory,
  updateAdminForumTopic,
} from "@/server/admin/forum-mutations";
import type { AdminContentMutationResult } from "@/server/admin/helpers";

import type { AdminActionState } from "@/app/actions/admin";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "No se encontró el recurso.",
  invalid_owner: "Usuario propietario no válido o deshabilitado.",
  invalid_category: "Categoría no válida.",
  has_votes: "No se pueden editar opciones con votos registrados.",
  duplicate: "Ya existe un registro con esos datos.",
  has_children: "No se puede eliminar: tiene elementos hijos.",
};

function mutationError(result: AdminContentMutationResult): AdminActionState {
  if (result.ok) return { success: true };
  return { errors: { form: [REASON_MESSAGES[result.reason] ?? "Operación no permitida."] } };
}

async function runDelete(
  listPath: string,
  revalidatePaths: string[],
  fn: () => Promise<AdminContentMutationResult>,
): Promise<AdminActionState> {
  await requireAdminAccess();
  try {
    const result = await fn();
    if (!result.ok) return mutationError(result);
    for (const path of revalidatePaths) revalidatePath(path);
    redirect(listPath);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo eliminar el recurso."] } };
  }
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function adminCreateGroupAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = groupWriteInputFromFormData(formData);
  const validation = validateGroupWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const membershipApprovalRequired = checkboxFromFormData(formData, "membershipApprovalRequired");

  try {
    const result = await createAdminGroup(
      ownerValidation.data,
      { ...validation.data, membershipApprovalRequired },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/groups");
    revalidatePath("/groups");
    redirect(`/admin/groups/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el grupo."] } };
  }
}

export async function adminUpdateGroupAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { errors: { form: ["Grupo no válido."] } };

  const input = groupWriteInputFromFormData(formData);
  const validation = validateGroupWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const membershipApprovalRequired = checkboxFromFormData(formData, "membershipApprovalRequired");

  try {
    const result = await updateAdminGroup(
      groupId,
      { ...validation.data, membershipApprovalRequired },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${groupId}`);
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return { success: true, message: "Grupo actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el grupo."] } };
  }
}

export async function adminDeleteGroupAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const groupId = String(formData.get("groupId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/groups");
  return runDelete(listPath, ["/admin/groups", "/groups", `/groups/${groupId}`], () =>
    deleteAdminGroup(groupId),
  );
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function adminCreateEventAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = eventWriteInputFromFormData(formData);
  const validation = validateEventWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const inviteOnly = checkboxFromFormData(formData, "inviteOnly");

  try {
    const result = await createAdminEvent(ownerValidation.data, { ...validation.data, inviteOnly }, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/events");
    revalidatePath("/events");
    redirect(`/admin/events/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el evento."] } };
  }
}

export async function adminUpdateEventAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return { errors: { form: ["Evento no válido."] } };

  const input = eventWriteInputFromFormData(formData);
  const validation = validateEventWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const inviteOnly = checkboxFromFormData(formData, "inviteOnly");

  try {
    const result = await updateAdminEvent(eventId, { ...validation.data, inviteOnly }, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true, message: "Evento actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el evento."] } };
  }
}

export async function adminDeleteEventAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/events");
  return runDelete(listPath, ["/admin/events", "/events", `/events/${eventId}`], () =>
    deleteAdminEvent(eventId),
  );
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export async function adminCreatePollAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const pollInput = pollWriteInputFromFormData(formData);
  const pollValidation = validatePollWriteInput(pollInput);
  if (!pollValidation.success) return { errors: pollValidation.errors };

  const optionsInput = pollOptionsWriteInputFromFormData(formData);
  const optionsValidation = validatePollOptionsWriteInput(optionsInput);
  if (!optionsValidation.success) return { errors: optionsValidation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await createAdminPoll(
      ownerValidation.data,
      { ...pollValidation.data, options: optionsValidation.data.options },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/polls");
    revalidatePath("/polls");
    redirect(`/admin/polls/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear la encuesta."] } };
  }
}

export async function adminUpdatePollAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const pollId = String(formData.get("pollId") ?? "").trim();
  if (!pollId) return { errors: { form: ["Encuesta no válida."] } };

  const pollInput = pollWriteInputFromFormData(formData);
  const pollValidation = validatePollWriteInput(pollInput);
  if (!pollValidation.success) return { errors: pollValidation.errors };

  const rawOptions = typeof formData.get("options") === "string" ? String(formData.get("options")).trim() : "";
  let options: string[] | null = null;
  if (rawOptions) {
    const optionsValidation = validatePollOptionsWriteInput(pollOptionsWriteInputFromFormData(formData));
    if (!optionsValidation.success) return { errors: optionsValidation.errors };
    options = optionsValidation.data.options;
  }

  const flags = catalogFlagsFromFormData(formData);
  const closed = checkboxFromFormData(formData, "closed");

  try {
    const result = await updateAdminPoll(
      pollId,
      { ...pollValidation.data, options, closed },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/polls");
    revalidatePath(`/admin/polls/${pollId}`);
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    return { success: true, message: "Encuesta actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la encuesta."] } };
  }
}

export async function adminDeletePollAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const pollId = String(formData.get("pollId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/polls");
  return runDelete(listPath, ["/admin/polls", "/polls", `/polls/${pollId}`], () => deleteAdminPoll(pollId));
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export async function adminCreateAlbumAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = albumWriteInputFromFormData(formData);
  const validation = validateAlbumWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await createAdminAlbum(ownerValidation.data, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/albums");
    revalidatePath("/albums");
    redirect(`/admin/albums/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el álbum."] } };
  }
}

export async function adminUpdateAlbumAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const albumId = String(formData.get("albumId") ?? "").trim();
  if (!albumId) return { errors: { form: ["Álbum no válido."] } };

  const input = albumWriteInputFromFormData(formData);
  const validation = validateAlbumWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await updateAdminAlbum(albumId, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/albums");
    revalidatePath(`/admin/albums/${albumId}`);
    revalidatePath("/albums");
    revalidatePath(`/albums/${albumId}`);
    return { success: true, message: "Álbum actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el álbum."] } };
  }
}

export async function adminDeleteAlbumAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const albumId = String(formData.get("albumId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/albums");
  return runDelete(listPath, ["/admin/albums", "/albums", `/albums/${albumId}`], () =>
    deleteAdminAlbum(albumId),
  );
}

// ─── Classifieds ──────────────────────────────────────────────────────────────

export async function adminCreateClassifiedAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = classifiedWriteInputFromFormData(formData);
  const validation = validateClassifiedWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await createAdminClassified(ownerValidation.data, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/classifieds");
    revalidatePath("/classifieds");
    redirect(`/admin/classifieds/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el clasificado."] } };
  }
}

export async function adminUpdateClassifiedAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const classifiedId = String(formData.get("classifiedId") ?? "").trim();
  if (!classifiedId) return { errors: { form: ["Clasificado no válido."] } };

  const input = classifiedWriteInputFromFormData(formData);
  const validation = validateClassifiedWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await updateAdminClassified(classifiedId, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/classifieds");
    revalidatePath(`/admin/classifieds/${classifiedId}`);
    revalidatePath("/classifieds");
    revalidatePath(`/classifieds/${classifiedId}`);
    return { success: true, message: "Clasificado actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el clasificado."] } };
  }
}

export async function adminDeleteClassifiedAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const classifiedId = String(formData.get("classifiedId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/classifieds");
  return runDelete(listPath, ["/admin/classifieds", "/classifieds", `/classifieds/${classifiedId}`], () =>
    deleteAdminClassified(classifiedId),
  );
}

// ─── Blogs ────────────────────────────────────────────────────────────────────

export async function adminCreateBlogAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = blogWriteInputFromFormData(formData);
  const validation = validateBlogWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await createAdminBlog(ownerValidation.data, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/blogs");
    revalidatePath("/blogs");
    redirect(`/admin/blogs/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear la entrada."] } };
  }
}

export async function adminUpdateBlogAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const entryId = String(formData.get("entryId") ?? "").trim();
  if (!entryId) return { errors: { form: ["Entrada no válida."] } };

  const input = blogWriteInputFromFormData(formData);
  const validation = validateBlogWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await updateAdminBlog(entryId, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/blogs");
    revalidatePath(`/admin/blogs/${entryId}`);
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${entryId}`);
    return { success: true, message: "Entrada actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la entrada."] } };
  }
}

export async function adminDeleteBlogAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const entryId = String(formData.get("entryId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/blogs");
  return runDelete(listPath, ["/admin/blogs", "/blogs", `/blogs/${entryId}`], () => deleteAdminBlog(entryId));
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export async function adminCreateBusinessAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = businessWriteInputFromFormData(formData);
  const validation = validateBusinessWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await createAdminBusiness(ownerValidation.data, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/businesses");
    revalidatePath("/businesses");
    redirect(`/admin/businesses/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el negocio."] } };
  }
}

export async function adminUpdateBusinessAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const businessId = String(formData.get("businessId") ?? "").trim();
  if (!businessId) return { errors: { form: ["Negocio no válido."] } };

  const input = businessWriteInputFromFormData(formData);
  const validation = validateBusinessWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);

  try {
    const result = await updateAdminBusiness(businessId, validation.data, flags);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/businesses");
    revalidatePath(`/businesses/${businessId}`);
    return { success: true, message: "Negocio actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el negocio."] } };
  }
}

export async function adminDeleteBusinessAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const businessId = String(formData.get("businessId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/businesses");
  return runDelete(listPath, ["/admin/businesses", "/businesses", `/businesses/${businessId}`], () =>
    deleteAdminBusiness(businessId),
  );
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function adminCreateArticleAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const ownerValidation = validateOwnerUsername(ownerUsernameFromFormData(formData));
  if (!ownerValidation.success) return { errors: ownerValidation.errors };

  const input = articleWriteInputFromFormData(formData);
  const validation = validateArticleWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const draft = checkboxFromFormData(formData, "draft");
  const approved = checkboxFromFormData(formData, "approved");

  try {
    const result = await createAdminArticle(
      ownerValidation.data,
      { ...validation.data, draft, approved: approved || !draft },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/articles");
    revalidatePath("/articles");
    redirect(`/admin/articles/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el artículo."] } };
  }
}

export async function adminUpdateArticleAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const articleId = String(formData.get("articleId") ?? "").trim();
  if (!articleId) return { errors: { form: ["Artículo no válido."] } };

  const input = articleWriteInputFromFormData(formData);
  const validation = validateArticleWriteInput(input);
  if (!validation.success) return { errors: validation.errors };

  const flags = catalogFlagsFromFormData(formData);
  const draft = checkboxFromFormData(formData, "draft");
  const approved = checkboxFromFormData(formData, "approved");

  try {
    const result = await updateAdminArticle(
      articleId,
      { ...validation.data, draft, approved },
      flags,
    );
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${articleId}`);
    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);
    return { success: true, message: "Artículo actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el artículo."] } };
  }
}

export async function adminDeleteArticleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const articleId = String(formData.get("articleId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/articles");
  return runDelete(listPath, ["/admin/articles", "/articles", `/articles/${articleId}`], () =>
    deleteAdminArticle(articleId),
  );
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export async function adminUpdateForumTopicAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const topicId = String(formData.get("topicId") ?? "").trim();
  if (!topicId) return { errors: { form: ["Tema no válido."] } };

  const input = forumTopicInputFromFormData(formData);
  const validation = validateForumTopicInput(input);
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await updateAdminForumTopic(topicId, {
      ...validation.data,
      isLocked: checkboxFromFormData(formData, "isLocked"),
      isSticky: checkboxFromFormData(formData, "isSticky"),
      isAnnouncement: checkboxFromFormData(formData, "isAnnouncement"),
    });
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/forum");
    revalidatePath(`/admin/forum/topics/${topicId}`);
    revalidatePath("/forum");
    return { success: true, message: "Tema actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el tema."] } };
  }
}

export async function adminDeleteForumTopicAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const topicId = String(formData.get("topicId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/forum");
  return runDelete(listPath, ["/admin/forum", "/forum"], () => deleteAdminForumTopic(topicId));
}

export async function adminUpdateForumCategoryAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) return { errors: { form: ["Categoría no válida."] } };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const position = Number(formData.get("position") ?? "0");

  if (!title || title.length > 120) {
    return { errors: { title: ["El título es obligatorio (máx. 120 caracteres)."] } };
  }
  if (!Number.isInteger(position) || position < 0) {
    return { errors: { position: ["Posición debe ser un entero ≥ 0."] } };
  }

  try {
    const result = await updateAdminForumCategory(categoryId, {
      title,
      description: description || null,
      position,
      isLocked: checkboxFromFormData(formData, "isLocked"),
      publicCanRead: checkboxFromFormData(formData, "publicCanRead"),
    });
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/forum");
    revalidatePath(`/admin/forum/categories/${categoryId}`);
    revalidatePath("/forum");
    return { success: true, message: "Categoría actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la categoría."] } };
  }
}

export async function adminDeleteForumCategoryAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/forum");
  return runDelete(listPath, ["/admin/forum", "/forum"], () => deleteAdminForumCategory(categoryId));
}

// ─── Catalog legacy ───────────────────────────────────────────────────────────

export async function adminCreateLevelAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const validation = validateLevelWriteInput(levelWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await createAdminLevel(validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/levels");
    redirect(`/admin/levels/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el nivel."] } };
  }
}

export async function adminUpdateLevelAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const levelId = String(formData.get("levelId") ?? "").trim();
  if (!levelId) return { errors: { form: ["Nivel no válido."] } };
  const validation = validateLevelWriteInput(levelWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await updateAdminLevel(levelId, validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/levels");
    revalidatePath(`/admin/levels/${levelId}`);
    return { success: true, message: "Nivel actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el nivel."] } };
  }
}

export async function adminDeleteLevelAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const levelId = String(formData.get("levelId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/levels");
  return runDelete(listPath, ["/admin/levels"], () => deleteAdminLevel(levelId));
}

export async function adminCreateSubnetworkAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const validation = validateSubnetworkWriteInput(subnetworkWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await createAdminSubnetwork(validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/subnetworks");
    redirect(`/admin/subnetworks/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear la subred."] } };
  }
}

export async function adminUpdateSubnetworkAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const subnetworkId = String(formData.get("subnetworkId") ?? "").trim();
  if (!subnetworkId) return { errors: { form: ["Subred no válida."] } };
  const validation = validateSubnetworkWriteInput(subnetworkWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await updateAdminSubnetwork(subnetworkId, validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/subnetworks");
    revalidatePath(`/admin/subnetworks/${subnetworkId}`);
    return { success: true, message: "Subred actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la subred."] } };
  }
}

export async function adminDeleteSubnetworkAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const subnetworkId = String(formData.get("subnetworkId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/subnetworks");
  return runDelete(listPath, ["/admin/subnetworks"], () => deleteAdminSubnetwork(subnetworkId));
}

export async function adminCreateSettingAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const validation = validateSettingWriteInput(settingWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await createAdminSetting(validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/settings");
    redirect(`/admin/settings/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear el ajuste."] } };
  }
}

export async function adminUpdateSettingAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const settingId = String(formData.get("settingId") ?? "").trim();
  if (!settingId) return { errors: { form: ["Ajuste no válido."] } };
  const validation = validateSettingWriteInput(settingWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await updateAdminSetting(settingId, validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/settings");
    revalidatePath(`/admin/settings/${settingId}`);
    return { success: true, message: "Ajuste actualizado." };
  } catch {
    return { errors: { form: ["No se pudo actualizar el ajuste."] } };
  }
}

export async function adminDeleteSettingAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const settingId = String(formData.get("settingId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/settings");
  return runDelete(listPath, ["/admin/settings"], () => deleteAdminSetting(settingId));
}

export async function adminCreateLanguageVariableAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const validation = validateLanguageVariableWriteInput(languageVariableWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await createAdminLanguageVariable(validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/language-variables");
    redirect(`/admin/language-variables/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { errors: { form: ["No se pudo crear la variable."] } };
  }
}

export async function adminUpdateLanguageVariableAction(
  _previous: AdminResourceFormState,
  formData: FormData,
): Promise<AdminResourceFormState> {
  await requireAdminAccess();
  const variableId = String(formData.get("variableId") ?? "").trim();
  if (!variableId) return { errors: { form: ["Variable no válida."] } };
  const validation = validateLanguageVariableWriteInput(languageVariableWriteInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };
  try {
    const result = await updateAdminLanguageVariable(variableId, validation.data);
    if (!result.ok) return mutationError(result);
    revalidatePath("/admin/language-variables");
    revalidatePath(`/admin/language-variables/${variableId}`);
    return { success: true, message: "Variable actualizada." };
  } catch {
    return { errors: { form: ["No se pudo actualizar la variable."] } };
  }
}

export async function adminDeleteLanguageVariableAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const variableId = String(formData.get("variableId") ?? "").trim();
  const listPath = String(formData.get("listPath") ?? "/admin/language-variables");
  return runDelete(listPath, ["/admin/language-variables"], () => deleteAdminLanguageVariable(variableId));
}
