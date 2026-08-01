export type AccessField =
  | "email"
  | "username"
  | "password"
  | "currentPassword"
  | "passwordConfirmation"
  | "termsAccepted"
  | "token"
  | "form";

export type AccessErrors = Partial<Record<AccessField, string[]>>;

export interface AccessFormState {
  errors?: AccessErrors;
  message?: string;
  success?: boolean;
  developmentLink?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  persistent: boolean;
  returnUrl: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  passwordConfirmation: string;
  termsAccepted: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: AccessErrors };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[A-Za-z0-9]+$/;
const passwordPattern = /^[A-Za-z0-9]+$/;

function firstString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function addError(errors: AccessErrors, field: AccessField, message: string): void {
  errors[field] = [...(errors[field] ?? []), message];
}

export function emailFromFormData(formData: FormData): string {
  return firstString(formData.get("email")).toLowerCase();
}

export function tokenFromFormData(formData: FormData): string {
  return firstString(formData.get("token"));
}

export function passwordPairFromFormData(formData: FormData): {
  password: string;
  passwordConfirmation: string;
} {
  return {
    password: typeof formData.get("password") === "string" ? String(formData.get("password")) : "",
    passwordConfirmation:
      typeof formData.get("passwordConfirmation") === "string"
        ? String(formData.get("passwordConfirmation"))
        : "",
  };
}

export function loginInputFromFormData(formData: FormData): LoginInput {
  const returnUrl = firstString(formData.get("returnUrl"));

  return {
    email: emailFromFormData(formData),
    password: typeof formData.get("password") === "string" ? String(formData.get("password")) : "",
    persistent: formData.get("persistent") === "on",
    returnUrl: returnUrl || "/home",
  };
}

export function registerInputFromFormData(formData: FormData): RegisterInput {
  return {
    email: emailFromFormData(formData),
    username: firstString(formData.get("username")),
    password: typeof formData.get("password") === "string" ? String(formData.get("password")) : "",
    passwordConfirmation:
      typeof formData.get("passwordConfirmation") === "string"
        ? String(formData.get("passwordConfirmation"))
        : "",
    termsAccepted: formData.get("termsAccepted") === "on",
  };
}

export function validateEmail(email: string): ValidationResult<string> {
  const errors: AccessErrors = {};
  if (!emailPattern.test(email)) addError(errors, "email", "Introduce un email válido.");
  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: email };
}

export function validatePasswordPair(
  password: string,
  passwordConfirmation: string,
): ValidationResult<{ password: string; passwordConfirmation: string }> {
  const errors: AccessErrors = {};
  if (password.length < 6) {
    addError(errors, "password", "La contraseña debe tener al menos 6 caracteres.");
  } else if (!passwordPattern.test(password)) {
    addError(errors, "password", "La contraseña debe ser alfanumérica en esta fase de paridad.");
  }
  if (password !== passwordConfirmation) {
    addError(errors, "passwordConfirmation", "Las contraseñas no coinciden.");
  }
  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: { password, passwordConfirmation } };
}

export function validateLogin(input: LoginInput): ValidationResult<LoginInput> {
  const errors: AccessErrors = {};

  if (!emailPattern.test(input.email)) {
    addError(errors, "email", "Introduce un email válido.");
  }
  if (!input.password) {
    addError(errors, "password", "Introduce tu contraseña.");
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input };
}

export function validateRegistration(input: RegisterInput): ValidationResult<RegisterInput> {
  const errors: AccessErrors = {};

  if (!emailPattern.test(input.email)) {
    addError(errors, "email", "Introduce un email válido.");
  }
  if (!input.username) {
    addError(errors, "username", "Introduce un nombre de usuario.");
  } else if (!usernamePattern.test(input.username)) {
    addError(errors, "username", "Usa solo letras y números, como en el registro legacy.");
  }

  const passwordValidation = validatePasswordPair(input.password, input.passwordConfirmation);
  if (!passwordValidation.success) Object.assign(errors, passwordValidation.errors);
  if (!input.termsAccepted) {
    addError(errors, "termsAccepted", "Debes aceptar los términos de servicio.");
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, data: input };
}

export function isSafeInternalRedirect(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export function safeInternalRedirect(value: string): string {
  return isSafeInternalRedirect(value) ? value : "/home";
}

export function currentPasswordFromFormData(formData: FormData): string {
  return typeof formData.get("currentPassword") === "string" ? String(formData.get("currentPassword")) : "";
}
