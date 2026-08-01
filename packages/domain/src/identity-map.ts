export const IDENTITY_MAP_SOURCE_SYSTEM = "socialengine-3";
export const IDENTITY_MAP_SOURCE_TABLE = "se_users";

export const IDENTITY_MAP_STATUS = {
  ACTIVE: "active",
  UNRESOLVED: "unresolved",
  MERGED: "merged",
  EXCLUDED: "excluded",
} as const;

export type IdentityMapStatus = typeof IDENTITY_MAP_STATUS[keyof typeof IDENTITY_MAP_STATUS];

export type LegacyUserReferenceResult =
  | { kind: "resolved"; userId: string; status: "active" | "merged" }
  | { kind: "invalid-reference"; reason: "non-positive-id" | "invalid-source" }
  | { kind: "missing-reference" }
  | { kind: "inactive-reference"; status: "unresolved" | "excluded" | "merged-without-canonical" };

export interface LegacyUserReference {
  sourceSystem: string;
  sourceTable: string;
  legacyUserId: number;
}

export function normalizeLegacyUserReference(input: Partial<LegacyUserReference>): LegacyUserReferenceResult | LegacyUserReference {
  const sourceSystem = typeof input.sourceSystem === "string" ? input.sourceSystem.trim() : "";
  const sourceTable = typeof input.sourceTable === "string" ? input.sourceTable.trim() : "";
  const legacyUserId = input.legacyUserId;

  if (!sourceSystem || !sourceTable) return { kind: "invalid-reference", reason: "invalid-source" };
  if (typeof legacyUserId !== "number" || !Number.isInteger(legacyUserId) || legacyUserId <= 0) {
    return { kind: "invalid-reference", reason: "non-positive-id" };
  }
  return { sourceSystem, sourceTable, legacyUserId };
}

export function resolveIdentityMapping(
  status: string,
  userId: string,
  canonicalUserId: string | null,
): LegacyUserReferenceResult {
  if (status === IDENTITY_MAP_STATUS.ACTIVE) return { kind: "resolved", userId, status: "active" };
  if (status === IDENTITY_MAP_STATUS.MERGED && canonicalUserId) {
    return { kind: "resolved", userId: canonicalUserId, status: "merged" };
  }
  if (status === IDENTITY_MAP_STATUS.UNRESOLVED || status === IDENTITY_MAP_STATUS.EXCLUDED) {
    return { kind: "inactive-reference", status };
  }
  return { kind: "inactive-reference", status: "merged-without-canonical" };
}
