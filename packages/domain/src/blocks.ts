export type BlockRelationship = "self" | "blocked_by_viewer" | "blocked_by_target" | "none";

export interface BlockedUser {
  username: string;
  displayName: string;
}

export interface BlockActionState {
  errors?: { form?: string[] };
  message?: string;
  success?: boolean;
}

export function blockTargetFromFormData(formData: FormData): string {
  const value = formData.get("username");
  return typeof value === "string" ? value.trim() : "";
}

export function validateBlockTarget(username: string): string | null {
  if (!username) return "No se ha indicado el usuario de destino.";
  if (username.length > 64 || !/^[A-Za-z0-9]+$/.test(username)) {
    return "El usuario de destino no es válido.";
  }
  return null;
}
