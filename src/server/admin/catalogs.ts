import { db } from "@/server/db/client";

export interface AdminLevelRow {
  id: string;
  legacyId: number | null;
  name: string;
  description: string;
  isDefault: boolean;
  isSignup: boolean;
}

export interface AdminSubnetworkRow {
  id: string;
  legacyId: number | null;
  nameLegacyId: number;
  field1Qualifier: string;
  field1Value: string;
  field2Qualifier: string;
  field2Value: string;
  themeLegacyId: number;
}

export interface AdminSettingRow {
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

export interface AdminLanguageVariableRow {
  id: string;
  legacyId: number;
  languageId: number;
  value: string | null;
  defaultValue: string | null;
}

export async function getAdminLevels(): Promise<AdminLevelRow[]> {
  return db.userLevel.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }, { id: "asc" }],
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

export async function getAdminSubnetworks(): Promise<AdminSubnetworkRow[]> {
  return db.subnetwork.findMany({
    orderBy: [{ legacyId: "asc" }, { id: "asc" }],
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

export async function getAdminSettings(): Promise<AdminSettingRow[]> {
  return db.setting.findMany({
    orderBy: [{ key: "asc" }, { id: "asc" }],
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

export async function getAdminLanguageVariables(): Promise<AdminLanguageVariableRow[]> {
  return db.languageVariable.findMany({
    orderBy: [{ languageId: "asc" }, { legacyId: "asc" }, { id: "asc" }],
    select: {
      id: true,
      legacyId: true,
      languageId: true,
      value: true,
      defaultValue: true,
    },
  });
}
