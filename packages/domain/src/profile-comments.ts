export const PROFILE_COMMENT_MAX_LENGTH = 2000;
export const PROFILE_COMMENT_LIST_LIMIT = 50;

export interface PublicProfileComment {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    username: string;
    displayName: string;
  };
  canEdit: boolean;
  canDelete: boolean;
}

export type ProfileCommentFormField = "body" | "form";
export type ProfileCommentErrors = Partial<Record<ProfileCommentFormField, string[]>>;

export interface ProfileCommentFormState {
  errors?: ProfileCommentErrors;
  message?: string;
  success?: boolean;
}

export function profileCommentBodyFromFormData(formData: FormData): string {
  const rawBody = formData.get("body");
  return typeof rawBody === "string" ? rawBody.trim() : "";
}

export function validateProfileCommentBody(body: string):
  | { success: true; body: string }
  | { success: false; errors: ProfileCommentErrors } {
  const errors: ProfileCommentErrors = {};
  if (!body) errors.body = ["Escribe un comentario antes de publicarlo."];
  else if (Array.from(body).length > PROFILE_COMMENT_MAX_LENGTH) {
    errors.body = [`El comentario no puede superar los ${PROFILE_COMMENT_MAX_LENGTH} caracteres.`];
  }

  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, body };
}
