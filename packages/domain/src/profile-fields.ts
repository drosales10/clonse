export const PROFILE_FIELD_TYPES = ["text", "textarea", "select", "radio", "checkbox", "date"] as const;

export type ProfileFieldType = (typeof PROFILE_FIELD_TYPES)[number];
export type ProfileFieldValue = string | string[] | null;

export interface ProfileFieldOption {
  value: string;
  label: string;
}

export interface ProfileFieldDefinition {
  id: string;
  categoryId: string;
  categoryTitle: string;
  parentFieldId: string | null;
  fieldKey: string;
  label: string;
  description: string | null;
  type: ProfileFieldType;
  required: boolean;
  maxLength: number | null;
  options: ProfileFieldOption[];
  displayMode: number;
  validationRegex: string | null;
  allowHtml: boolean;
}

export interface ProfileFieldRecord extends ProfileFieldDefinition {
  value: ProfileFieldValue;
}

export type ProfileFieldsErrors = Record<string, string[]>;

export interface ProfileFieldsFormState {
  errors?: ProfileFieldsErrors;
  message?: string;
  success?: boolean;
}

export function isProfileFieldType(value: string): value is ProfileFieldType {
  return PROFILE_FIELD_TYPES.includes(value as ProfileFieldType);
}

export function profileFieldInputName(fieldId: string): string {
  return `field_${fieldId}`;
}

export function profileFieldsFromFormData(
  formData: FormData,
  definitions: ProfileFieldDefinition[],
): { success: true; values: Record<string, ProfileFieldValue> } | { success: false; errors: ProfileFieldsErrors } {
  const values: Record<string, ProfileFieldValue> = {};
  const errors: ProfileFieldsErrors = {};

  for (const definition of definitions) {
    const inputName = profileFieldInputName(definition.id);
    const rawValues = formData.getAll(inputName).filter((value): value is string => typeof value === "string");
    const rawValue = definition.type === "checkbox" ? rawValues : (rawValues[0] ?? "").trim();

    if (definition.validationRegex || definition.allowHtml) {
      errors[definition.id] = ["Este campo requiere una configuración legacy aún no migrada."];
      continue;
    }

    if (isEmptyProfileFieldValue(rawValue)) {
      if (definition.required) errors[definition.id] = ["Este campo es obligatorio."];
      values[definition.id] = null;
      continue;
    }

    const validationError = validateProfileFieldValue(definition, rawValue);
    if (validationError) {
      errors[definition.id] = [validationError];
      continue;
    }

    values[definition.id] = rawValue;
  }

  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, values };
}

function isEmptyProfileFieldValue(value: string | string[]): boolean {
  return Array.isArray(value) ? value.length === 0 : value.trim() === "";
}

function validateProfileFieldValue(
  definition: ProfileFieldDefinition,
  value: string | string[],
): string | null {
  if (definition.type === "checkbox") {
    if (!Array.isArray(value)) return "Selecciona una opción válida.";
    const allowed = new Set(definition.options.map((option) => option.value));
    if (value.some((option) => !allowed.has(option))) return "Selecciona solo opciones permitidas.";
    return null;
  }

  if (Array.isArray(value)) return "Introduce un valor válido.";
  if (definition.maxLength !== null && Array.from(value).length > definition.maxLength) {
    return `Este campo no puede superar los ${definition.maxLength} caracteres.`;
  }

  if (definition.type === "select" || definition.type === "radio") {
    if (!definition.options.some((option) => option.value === value)) return "Selecciona una opción permitida.";
  }

  if (definition.type === "date" && !isIsoDate(value)) return "Introduce una fecha válida.";
  return null;
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export interface PublicProfileField {
  categoryTitle: string;
  label: string;
  type: ProfileFieldType;
  value: Exclude<ProfileFieldValue, null>;
  displayMode: number;
}
