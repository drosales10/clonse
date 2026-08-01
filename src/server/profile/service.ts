import { Prisma } from "@prisma/client";

import type {
  ProfileFieldDefinition,
  ProfileFieldOption,
  ProfileFieldRecord,
  ProfileFieldValue,
  PublicProfileField,
} from "@domain/profile-fields";
import { isProfileFieldType } from "@domain/profile-fields";
import type { ProfileSettingsInput, PublicProfile } from "@domain/profile";
import { canViewProfile } from "@domain/profile";

import { db } from "@/server/db/client";

export type ProfileLookup =
  | { kind: "profile"; profile: PublicProfile }
  | { kind: "private" };

export async function getPublicProfile(
  username: string,
  viewerId: string | null,
): Promise<ProfileLookup | null> {
  const owner = await db.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      enabled: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      status: true,
      profilePrivacy: true,
      verifiedAt: true,
      signUpDate: true,
    },
  });

  if (!owner) return null;
  if (!canViewProfile(owner.id, owner.profilePrivacy, viewerId)) return { kind: "private" };

  const fields = await getPublicProfileFields(owner.id);
  return {
    kind: "profile",
    profile: {
      username: owner.username,
      displayName: owner.displayName,
      status: owner.status,
      verified: owner.verifiedAt !== null,
      memberSince: owner.signUpDate,
      visibility: "public",
      fields,
    },
  };
}

export interface OwnProfileSettings {
  username: string;
  displayName: string;
  profilePrivacy: number;
  status: string | null;
}

export async function getOwnProfileSettings(userId: string): Promise<OwnProfileSettings | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      displayName: true,
      profilePrivacy: true,
      status: true,
    },
  });
}

export async function updateOwnProfileSettings(
  userId: string,
  input: ProfileSettingsInput,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        profilePrivacy: input.profilePrivacy,
        status: input.status,
      },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, reason: "not_found" };
    }
    throw error;
  }
}

export async function getOwnProfileFields(userId: string): Promise<ProfileFieldRecord[]> {
  return getProfileFieldRecords(userId, false);
}

export async function getPublicProfileFields(userId: string): Promise<PublicProfileField[]> {
  const records = await getProfileFieldRecords(userId, true);
  return records
    .filter((record): record is ProfileFieldRecord & { value: Exclude<ProfileFieldValue, null> } => record.value !== null)
    .map((record) => ({
      categoryTitle: record.categoryTitle,
      label: record.label,
      type: record.type,
      value: record.value,
      displayMode: record.displayMode,
    }));
}

export async function updateOwnProfileFields(
  userId: string,
  values: Record<string, ProfileFieldValue>,
): Promise<{ ok: true } | { ok: false; reason: "not_found" | "invalid_field" }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };

  const definitions = await loadProfileFieldDefinitions(false);
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  if (Object.keys(values).some((fieldId) => !definitionsById.has(fieldId))) {
    return { ok: false, reason: "invalid_field" };
  }

  for (const definition of definitions) {
    if (definition.required && (values[definition.id] === null || values[definition.id] === undefined)) {
      return { ok: false, reason: "invalid_field" };
    }
  }

  const operations = Object.entries(values).map(([fieldId, value]) => {
    if (value === null) {
      return db.profileFieldValue.deleteMany({ where: { userId, fieldId } });
    }
    return db.profileFieldValue.upsert({
      where: { userId_fieldId: { userId, fieldId } },
      create: { userId, fieldId, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  });

  if (operations.length > 0) await db.$transaction(operations);
  return { ok: true };
}

async function getProfileFieldRecords(userId: string, publicOnly: boolean): Promise<ProfileFieldRecord[]> {
  const definitions = await loadProfileFieldDefinitions(publicOnly);
  if (definitions.length === 0) return [];

  const values = await db.profileFieldValue.findMany({
    where: { userId, fieldId: { in: definitions.map((definition) => definition.id) } },
    select: { fieldId: true, value: true },
  });
  const valuesByFieldId = new Map(values.map((record) => [record.fieldId, normalizeProfileFieldValue(record.value)]));

  return definitions.map((definition) => ({
    ...definition,
    value: valuesByFieldId.get(definition.id) ?? null,
  }));
}

async function loadProfileFieldDefinitions(publicOnly: boolean): Promise<ProfileFieldDefinition[]> {
  const rows = await db.profileField.findMany({
    where: {
      active: true,
      parentFieldId: null,
      category: { active: true },
      ...(publicOnly ? { displayMode: { not: 0 } } : {}),
    },
    select: {
      id: true,
      categoryId: true,
      parentFieldId: true,
      fieldKey: true,
      label: true,
      description: true,
      type: true,
      required: true,
      maxLength: true,
      options: true,
      displayMode: true,
      validationRegex: true,
      allowHtml: true,
      category: { select: { title: true, sortOrder: true } },
      sortOrder: true,
    },
  });

  return rows
    .sort((left, right) => left.category.sortOrder - right.category.sortOrder || left.sortOrder - right.sortOrder)
    .map((row) => toProfileFieldDefinition(row))
    .filter((definition): definition is ProfileFieldDefinition => definition !== null);
}

function toProfileFieldDefinition(row: {
  id: string;
  categoryId: string;
  parentFieldId: string | null;
  fieldKey: string;
  label: string;
  description: string | null;
  type: string;
  required: boolean;
  maxLength: number | null;
  options: Prisma.JsonValue | null;
  displayMode: number;
  validationRegex: string | null;
  allowHtml: boolean;
  category: { title: string; sortOrder: number };
}): ProfileFieldDefinition | null {
  if (!isProfileFieldType(row.type)) return null;
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryTitle: row.category.title,
    parentFieldId: row.parentFieldId,
    fieldKey: row.fieldKey,
    label: row.label,
    description: row.description,
    type: row.type,
    required: row.required,
    maxLength: row.maxLength,
    options: parseProfileFieldOptions(row.options),
    displayMode: row.displayMode,
    validationRegex: row.validationRegex,
    allowHtml: row.allowHtml,
  };
}

function parseProfileFieldOptions(value: Prisma.JsonValue | null): ProfileFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option): ProfileFieldOption[] => {
    if (!option || typeof option !== "object" || Array.isArray(option)) return [];
    const candidate = option as { value?: unknown; label?: unknown };
    return typeof candidate.value === "string" && typeof candidate.label === "string"
      ? [{ value: candidate.value, label: candidate.label }]
      : [];
  });
}

function normalizeProfileFieldValue(value: Prisma.JsonValue): ProfileFieldValue {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string[];
  return null;
}
