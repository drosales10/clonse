export type AdminResourceFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
};

export function ownerUsernameFromFormData(formData: FormData): string {
  const raw =
    typeof formData.get("ownerUsername") === "string" ? String(formData.get("ownerUsername")).trim() : "";
  return raw.replace(/^@+/, "");
}

export function validateOwnerUsername(username: string):
  | { success: true; data: string }
  | { success: false; errors: { ownerUsername?: string[] } } {
  if (!username || username.length > 64 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { success: false, errors: { ownerUsername: ["Indica un nombre de usuario válido (sin @)."] } };
  }
  return { success: true, data: username };
}

export function catalogFlagsFromFormData(formData: FormData): {
  catalogVisible: boolean;
  searchable: boolean;
} {
  return {
    catalogVisible: formData.get("catalogVisible") === "1",
    searchable: formData.get("searchable") === "1",
  };
}

export function checkboxFromFormData(formData: FormData, name: string): boolean {
  return formData.get(name) === "1";
}
