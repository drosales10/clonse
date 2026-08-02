import { db } from "@/server/db/client";
import type { AdminContentMutationResult } from "@/server/admin/helpers";

export interface AdminLevelDetail {
  id: string;
  legacyId: number | null;
  name: string;
  description: string;
  isDefault: boolean;
  isSignup: boolean;
}

export interface AdminSubnetworkDetail {
  id: string;
  legacyId: number | null;
  nameLegacyId: number;
  field1Qualifier: string;
  field1Value: string;
  field2Qualifier: string;
  field2Value: string;
  themeLegacyId: number;
}

export interface AdminSettingDetail {
  id: string;
  legacyId: number | null;
  key: string;
  version: string;
  isOnline: boolean;
  urlEnabled: boolean;
  usernameEnabled: boolean;
  subnetField1Id: number;
  subnetField2Id: number;
}

export interface AdminLanguageVariableDetail {
  id: string;
  legacyId: number;
  languageId: number;
  value: string | null;
  defaultValue: string | null;
}

export async function getAdminLevelDetail(levelId: string): Promise<AdminLevelDetail | null> {
  return db.userLevel.findUnique({
    where: { id: levelId },
    select: {
      id: true,
      legacyId: true,
      name: true,
      description: true,
      isDefault: true,
      isSignup: true,
    },
  });
}

export async function createAdminLevel(input: {
  name: string;
  description: string;
  isDefault: boolean;
  isSignup: boolean;
}): Promise<AdminContentMutationResult> {
  if (input.isDefault) {
    await db.userLevel.updateMany({ data: { isDefault: false } });
  }
  const level = await db.userLevel.create({
    data: input,
    select: { id: true },
  });
  return { ok: true, id: level.id };
}

export async function updateAdminLevel(
  levelId: string,
  input: { name: string; description: string; isDefault: boolean; isSignup: boolean },
): Promise<AdminContentMutationResult> {
  const level = await db.userLevel.findUnique({ where: { id: levelId }, select: { id: true } });
  if (!level) return { ok: false, reason: "not_found" };
  if (input.isDefault) {
    await db.userLevel.updateMany({ where: { NOT: { id: levelId } }, data: { isDefault: false } });
  }
  await db.userLevel.update({ where: { id: levelId }, data: input });
  return { ok: true };
}

export async function deleteAdminLevel(levelId: string): Promise<AdminContentMutationResult> {
  const level = await db.userLevel.findUnique({ where: { id: levelId }, select: { id: true } });
  if (!level) return { ok: false, reason: "not_found" };
  await db.userLevel.delete({ where: { id: level.id } });
  return { ok: true };
}

export async function getAdminSubnetworkDetail(subnetworkId: string): Promise<AdminSubnetworkDetail | null> {
  return db.subnetwork.findUnique({
    where: { id: subnetworkId },
    select: {
      id: true,
      legacyId: true,
      nameLegacyId: true,
      field1Qualifier: true,
      field1Value: true,
      field2Qualifier: true,
      field2Value: true,
      themeLegacyId: true,
    },
  });
}

export async function createAdminSubnetwork(input: {
  nameLegacyId: number;
  field1Qualifier: string;
  field1Value: string;
  field2Qualifier: string;
  field2Value: string;
  themeLegacyId: number;
}): Promise<AdminContentMutationResult> {
  const row = await db.subnetwork.create({ data: input, select: { id: true } });
  return { ok: true, id: row.id };
}

export async function updateAdminSubnetwork(
  subnetworkId: string,
  input: {
    nameLegacyId: number;
    field1Qualifier: string;
    field1Value: string;
    field2Qualifier: string;
    field2Value: string;
    themeLegacyId: number;
  },
): Promise<AdminContentMutationResult> {
  const row = await db.subnetwork.findUnique({ where: { id: subnetworkId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  await db.subnetwork.update({ where: { id: subnetworkId }, data: input });
  return { ok: true };
}

export async function deleteAdminSubnetwork(subnetworkId: string): Promise<AdminContentMutationResult> {
  const row = await db.subnetwork.findUnique({ where: { id: subnetworkId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  await db.subnetwork.delete({ where: { id: subnetworkId } });
  return { ok: true };
}

export async function getAdminSettingDetail(settingId: string): Promise<AdminSettingDetail | null> {
  return db.setting.findUnique({
    where: { id: settingId },
    select: {
      id: true,
      legacyId: true,
      key: true,
      version: true,
      isOnline: true,
      urlEnabled: true,
      usernameEnabled: true,
      subnetField1Id: true,
      subnetField2Id: true,
    },
  });
}

export async function createAdminSetting(input: {
  key: string;
  version: string;
  isOnline: boolean;
  urlEnabled: boolean;
  usernameEnabled: boolean;
  subnetField1Id: number;
  subnetField2Id: number;
}): Promise<AdminContentMutationResult> {
  const existing = await db.setting.findFirst({ where: { key: input.key }, select: { id: true } });
  if (existing) return { ok: false, reason: "duplicate" };
  const row = await db.setting.create({ data: input, select: { id: true } });
  return { ok: true, id: row.id };
}

export async function updateAdminSetting(
  settingId: string,
  input: {
    key: string;
    version: string;
    isOnline: boolean;
    urlEnabled: boolean;
    usernameEnabled: boolean;
    subnetField1Id: number;
    subnetField2Id: number;
  },
): Promise<AdminContentMutationResult> {
  const row = await db.setting.findUnique({ where: { id: settingId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  const duplicate = await db.setting.findFirst({
    where: { key: input.key, NOT: { id: settingId } },
    select: { id: true },
  });
  if (duplicate) return { ok: false, reason: "duplicate" };
  await db.setting.update({ where: { id: settingId }, data: input });
  return { ok: true };
}

export async function deleteAdminSetting(settingId: string): Promise<AdminContentMutationResult> {
  const row = await db.setting.findUnique({ where: { id: settingId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  await db.setting.delete({ where: { id: settingId } });
  return { ok: true };
}

export async function getAdminLanguageVariableDetail(
  variableId: string,
): Promise<AdminLanguageVariableDetail | null> {
  return db.languageVariable.findUnique({
    where: { id: variableId },
    select: {
      id: true,
      legacyId: true,
      languageId: true,
      value: true,
      defaultValue: true,
    },
  });
}

export async function createAdminLanguageVariable(input: {
  legacyId: number;
  languageId: number;
  value: string | null;
  defaultValue: string | null;
}): Promise<AdminContentMutationResult> {
  const existing = await db.languageVariable.findFirst({
    where: { legacyId: input.legacyId, languageId: input.languageId },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "duplicate" };
  const row = await db.languageVariable.create({ data: input, select: { id: true } });
  return { ok: true, id: row.id };
}

export async function updateAdminLanguageVariable(
  variableId: string,
  input: {
    legacyId: number;
    languageId: number;
    value: string | null;
    defaultValue: string | null;
  },
): Promise<AdminContentMutationResult> {
  const row = await db.languageVariable.findUnique({ where: { id: variableId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  const duplicate = await db.languageVariable.findFirst({
    where: {
      legacyId: input.legacyId,
      languageId: input.languageId,
      NOT: { id: variableId },
    },
    select: { id: true },
  });
  if (duplicate) return { ok: false, reason: "duplicate" };
  await db.languageVariable.update({ where: { id: variableId }, data: input });
  return { ok: true };
}

export async function deleteAdminLanguageVariable(variableId: string): Promise<AdminContentMutationResult> {
  const row = await db.languageVariable.findUnique({ where: { id: variableId }, select: { id: true } });
  if (!row) return { ok: false, reason: "not_found" };
  await db.languageVariable.delete({ where: { id: variableId } });
  return { ok: true };
}
