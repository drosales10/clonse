import { passwordPairFromFormData, validatePasswordPair } from "./access";

export type AdminUserPasswordFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export function adminPasswordResetInputFromFormData(formData: FormData): {
  password: string;
  passwordConfirmation: string;
} {
  return passwordPairFromFormData(formData);
}

export function validateAdminPasswordResetInput(input: {
  password: string;
  passwordConfirmation: string;
}):
  | { success: true; data: { password: string } }
  | { success: false; errors: NonNullable<AdminUserPasswordFormState["errors"]> } {
  const validation = validatePasswordPair(input.password, input.passwordConfirmation);
  if (!validation.success) return { success: false, errors: validation.errors };
  return { success: true, data: { password: validation.data.password } };
}
