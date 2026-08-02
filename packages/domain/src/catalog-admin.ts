import type { AdminResourceFormState } from "./admin-crud";

export type LevelAdminFormState = AdminResourceFormState;
export type SubnetworkAdminFormState = AdminResourceFormState;
export type SettingAdminFormState = AdminResourceFormState;
export type LanguageVariableAdminFormState = AdminResourceFormState;

export function levelWriteInputFromFormData(formData: FormData): {
  name: string;
  description: string;
  isDefault: boolean;
  isSignup: boolean;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  return {
    name: read("name"),
    description: read("description"),
    isDefault: formData.get("isDefault") === "1",
    isSignup: formData.get("isSignup") === "1",
  };
}

export function validateLevelWriteInput(input: ReturnType<typeof levelWriteInputFromFormData>):
  | { success: true; data: typeof input }
  | { success: false; errors: NonNullable<LevelAdminFormState["errors"]> } {
  const errors: NonNullable<LevelAdminFormState["errors"]> = {};
  if (!input.name || input.name.length > 120) {
    errors.name = ["El nombre es obligatorio (máx. 120 caracteres)."];
  }
  if (input.description.length > 500) {
    errors.description = ["La descripción no puede superar 500 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: input };
}

export function subnetworkWriteInputFromFormData(formData: FormData): {
  nameLegacyId: string;
  field1Qualifier: string;
  field1Value: string;
  field2Qualifier: string;
  field2Value: string;
  themeLegacyId: string;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  return {
    nameLegacyId: read("nameLegacyId"),
    field1Qualifier: read("field1Qualifier"),
    field1Value: read("field1Value"),
    field2Qualifier: read("field2Qualifier"),
    field2Value: read("field2Value"),
    themeLegacyId: read("themeLegacyId"),
  };
}

export function validateSubnetworkWriteInput(input: ReturnType<typeof subnetworkWriteInputFromFormData>):
  | {
      success: true;
      data: {
        nameLegacyId: number;
        field1Qualifier: string;
        field1Value: string;
        field2Qualifier: string;
        field2Value: string;
        themeLegacyId: number;
      };
    }
  | { success: false; errors: NonNullable<SubnetworkAdminFormState["errors"]> } {
  const errors: NonNullable<SubnetworkAdminFormState["errors"]> = {};
  const nameLegacyId = Number(input.nameLegacyId);
  const themeLegacyId = Number(input.themeLegacyId);
  if (!Number.isInteger(nameLegacyId) || nameLegacyId < 0) {
    errors.nameLegacyId = ["ID de nombre legacy debe ser un entero ≥ 0."];
  }
  if (!Number.isInteger(themeLegacyId) || themeLegacyId < 0) {
    errors.themeLegacyId = ["ID de tema legacy debe ser un entero ≥ 0."];
  }
  for (const [field, max] of [
    ["field1Qualifier", 64],
    ["field1Value", 255],
    ["field2Qualifier", 64],
    ["field2Value", 255],
  ] as const) {
    if (input[field].length > max) {
      errors[field] = [`Máximo ${max} caracteres.`];
    }
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      nameLegacyId,
      field1Qualifier: input.field1Qualifier,
      field1Value: input.field1Value,
      field2Qualifier: input.field2Qualifier,
      field2Value: input.field2Value,
      themeLegacyId,
    },
  };
}

export function settingWriteInputFromFormData(formData: FormData): {
  key: string;
  version: string;
  isOnline: boolean;
  urlEnabled: boolean;
  usernameEnabled: boolean;
  subnetField1Id: string;
  subnetField2Id: string;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  return {
    key: read("key"),
    version: read("version"),
    isOnline: formData.get("isOnline") === "1",
    urlEnabled: formData.get("urlEnabled") === "1",
    usernameEnabled: formData.get("usernameEnabled") === "1",
    subnetField1Id: read("subnetField1Id"),
    subnetField2Id: read("subnetField2Id"),
  };
}

export function validateSettingWriteInput(input: ReturnType<typeof settingWriteInputFromFormData>):
  | {
      success: true;
      data: {
        key: string;
        version: string;
        isOnline: boolean;
        urlEnabled: boolean;
        usernameEnabled: boolean;
        subnetField1Id: number;
        subnetField2Id: number;
      };
    }
  | { success: false; errors: NonNullable<SettingAdminFormState["errors"]> } {
  const errors: NonNullable<SettingAdminFormState["errors"]> = {};
  if (!input.key || input.key.length > 120) {
    errors.key = ["La clave es obligatoria (máx. 120 caracteres)."];
  }
  if (input.version.length > 32) {
    errors.version = ["La versión no puede superar 32 caracteres."];
  }
  const subnetField1Id = Number(input.subnetField1Id);
  const subnetField2Id = Number(input.subnetField2Id);
  if (!Number.isInteger(subnetField1Id)) errors.subnetField1Id = ["Campo subred 1 debe ser entero."];
  if (!Number.isInteger(subnetField2Id)) errors.subnetField2Id = ["Campo subred 2 debe ser entero."];
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      key: input.key,
      version: input.version,
      isOnline: input.isOnline,
      urlEnabled: input.urlEnabled,
      usernameEnabled: input.usernameEnabled,
      subnetField1Id,
      subnetField2Id,
    },
  };
}

export function languageVariableWriteInputFromFormData(formData: FormData): {
  legacyId: string;
  languageId: string;
  value: string;
  defaultValue: string;
} {
  const read = (name: string) =>
    typeof formData.get(name) === "string" ? String(formData.get(name)).trim() : "";
  return {
    legacyId: read("legacyId"),
    languageId: read("languageId"),
    value: read("value"),
    defaultValue: read("defaultValue"),
  };
}

export function validateLanguageVariableWriteInput(
  input: ReturnType<typeof languageVariableWriteInputFromFormData>,
):
  | {
      success: true;
      data: {
        legacyId: number;
        languageId: number;
        value: string | null;
        defaultValue: string | null;
      };
    }
  | { success: false; errors: NonNullable<LanguageVariableAdminFormState["errors"]> } {
  const errors: NonNullable<LanguageVariableAdminFormState["errors"]> = {};
  const legacyId = Number(input.legacyId);
  const languageId = Number(input.languageId);
  if (!Number.isInteger(legacyId) || legacyId < 0) {
    errors.legacyId = ["Legacy ID debe ser un entero ≥ 0."];
  }
  if (!Number.isInteger(languageId) || languageId < 0) {
    errors.languageId = ["Language ID debe ser un entero ≥ 0."];
  }
  if (input.value.length > 2000) errors.value = ["Valor demasiado largo."];
  if (input.defaultValue.length > 2000) errors.defaultValue = ["Valor por defecto demasiado largo."];
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      legacyId,
      languageId,
      value: input.value || null,
      defaultValue: input.defaultValue || null,
    },
  };
}
