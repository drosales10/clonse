import { PROFILE_PRIVACY } from "./profile";

export type AdminModuleKind =
  | "group"
  | "event"
  | "poll"
  | "album"
  | "classified"
  | "blog"
  | "business"
  | "article"
  | "forum-topic"
  | "forum-category"
  | "user-profile";

export type AdminFlagFieldType = "boolean" | "privacy" | "datetime";

export interface AdminFlagFieldDef {
  key: string;
  label: string;
  type: AdminFlagFieldType;
  help?: string;
  confirmWhenFalse?: boolean;
}

export const ADMIN_PRIVACY_OPTIONS = [
  { value: PROFILE_PRIVACY.NOBODY, label: "Nadie (0)" },
  { value: PROFILE_PRIVACY.OWNER_ONLY, label: "Solo propietario" },
  { value: PROFILE_PRIVACY.CONNECTIONS, label: "Conexiones" },
  { value: PROFILE_PRIVACY.CONNECTIONS_AND_SUBNETWORK, label: "Conexiones y subred" },
  { value: PROFILE_PRIVACY.NETWORK, label: "Red" },
  { value: PROFILE_PRIVACY.REGISTERED, label: "Usuarios registrados" },
  { value: PROFILE_PRIVACY.EVERYONE, label: "Todos (público)" },
] as const;

export const ADMIN_MODULE_FLAG_SCHEMAS: Record<AdminModuleKind, AdminFlagFieldDef[]> = {
  group: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true, help: "Si está desactivado, solo el propietario ve el grupo en cliente." },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "inviteEnabled", label: "Invitaciones habilitadas", type: "boolean" },
    { key: "uploadEnabled", label: "Subidas habilitadas", type: "boolean" },
    { key: "membershipApprovalRequired", label: "Aprobación de membresía", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios", type: "privacy" },
    { key: "discussionPrivacy", label: "Privacidad de debate", type: "privacy" },
  ],
  event: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "inviteOnly", label: "Solo por invitación", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
  ],
  poll: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "closed", label: "Encuesta cerrada (no votar)", type: "boolean", confirmWhenFalse: false },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios", type: "privacy" },
  ],
  album: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios", type: "privacy" },
  ],
  classified: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
  ],
  blog: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios", type: "privacy" },
  ],
  business: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "featured", label: "Destacado", type: "boolean" },
    { key: "sponsored", label: "Patrocinado", type: "boolean" },
    { key: "approved", label: "Aprobado editorialmente", type: "boolean", help: "Controla approvedAt en servidor." },
    { key: "expiresAt", label: "Caduca el", type: "datetime", help: "Vacío = sin caducidad." },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
  ],
  article: [
    { key: "catalogVisible", label: "Visible en catálogo", type: "boolean", confirmWhenFalse: true },
    { key: "searchable", label: "Buscable / indexable", type: "boolean" },
    { key: "draft", label: "Borrador", type: "boolean" },
    { key: "approved", label: "Aprobado", type: "boolean" },
    { key: "featured", label: "Destacado", type: "boolean" },
    { key: "privacy", label: "Privacidad de lectura", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios", type: "privacy" },
  ],
  "forum-topic": [
    { key: "isLocked", label: "Tema bloqueado", type: "boolean" },
    { key: "isSticky", label: "Fijado (sticky)", type: "boolean" },
    { key: "isAnnouncement", label: "Anuncio", type: "boolean" },
  ],
  "forum-category": [
    { key: "isLocked", label: "Categoría bloqueada", type: "boolean" },
    { key: "publicCanRead", label: "Lectura pública", type: "boolean", help: "Permite lectura anónima cuando aplique." },
  ],
  "user-profile": [
    { key: "enabled", label: "Cuenta habilitada", type: "boolean", confirmWhenFalse: true },
    { key: "verified", label: "Email verificado", type: "boolean" },
    { key: "profilePrivacy", label: "Privacidad del perfil", type: "privacy" },
    { key: "commentsPrivacy", label: "Privacidad de comentarios de perfil", type: "privacy" },
    { key: "saveProfileViews", label: "Registrar visitas al perfil", type: "boolean" },
  ],
};

export type AdminModuleFlagsFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
};

export function adminModuleFlagsFromFormData(
  kind: AdminModuleKind,
  formData: FormData,
): Record<string, boolean | number | string | null> {
  const schema = ADMIN_MODULE_FLAG_SCHEMAS[kind];
  const values: Record<string, boolean | number | string | null> = {};

  for (const field of schema) {
    if (field.type === "boolean") {
      values[field.key] = formData.get(field.key) === "1";
      continue;
    }
    if (field.type === "privacy") {
      const raw = typeof formData.get(field.key) === "string" ? String(formData.get(field.key)).trim() : "";
      values[field.key] = raw === "" ? null : Number(raw);
      continue;
    }
    if (field.type === "datetime") {
      const raw = typeof formData.get(field.key) === "string" ? String(formData.get(field.key)).trim() : "";
      values[field.key] = raw || null;
    }
  }

  return values;
}

export function requiresFlagsConfirmation(
  kind: AdminModuleKind,
  current: Record<string, boolean | number | string | null>,
  next: Record<string, boolean | number | string | null>,
): boolean {
  for (const field of ADMIN_MODULE_FLAG_SCHEMAS[kind]) {
    if (!field.confirmWhenFalse) continue;
    const was = Boolean(current[field.key]);
    const now = Boolean(next[field.key]);
    if (was && !now) return true;
  }
  return false;
}
