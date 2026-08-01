export type AdminAccessField = "username" | "password";

export type AdminAccessErrors = Partial<Record<AdminAccessField, string[]>>;

export interface AdminLoginFormState {
  errors?: AdminAccessErrors;
  message?: string;
}

export interface AdminLoginInput {
  username: string;
  password: string;
  persistent: boolean;
}

export function adminLoginInputFromFormData(formData: FormData): AdminLoginInput {
  return {
    username: typeof formData.get("username") === "string" ? String(formData.get("username")).trim() : "",
    password: typeof formData.get("password") === "string" ? String(formData.get("password")) : "",
    persistent: formData.get("persistent") === "on",
  };
}

export function validateAdminLogin(input: AdminLoginInput):
  | { success: true; data: AdminLoginInput }
  | { success: false; errors: AdminAccessErrors } {
  const errors: AdminAccessErrors = {};
  if (!input.username) errors.username = ["Introduce tu usuario administrativo."];
  if (!input.password) errors.password = ["Introduce tu contraseña."];
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data: input };
}
