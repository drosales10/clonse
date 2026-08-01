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

export interface ApprovedIdentityMapping {
  sourceSystem: string;
  sourceTable: string;
  legacyUserId: number;
  userId: string;
  status: "active" | "merged";
  canonicalUserId: string | null;
  reasonCode: string | null;
}

export type ApprovedIdentityMappingValidation =
  | { valid: true; value: ApprovedIdentityMapping }
  | { valid: false; reason: "invalid-reference" | "invalid-destination-user" | "invalid-status" | "invalid-merge" };

export function validateApprovedIdentityMapping(
  input: Partial<ApprovedIdentityMapping>,
): ApprovedIdentityMappingValidation {
  const reference = normalizeLegacyUserReference(input);
  if ("kind" in reference) return { valid: false, reason: "invalid-reference" };
  if (typeof input.userId !== "string" || input.userId.trim() === "") {
    return { valid: false, reason: "invalid-destination-user" };
  }
  if (input.status !== IDENTITY_MAP_STATUS.ACTIVE && input.status !== IDENTITY_MAP_STATUS.MERGED) {
    return { valid: false, reason: "invalid-status" };
  }

  const canonicalUserId = typeof input.canonicalUserId === "string" && input.canonicalUserId.trim() !== ""
    ? input.canonicalUserId.trim()
    : null;
  if (input.status === IDENTITY_MAP_STATUS.MERGED && canonicalUserId === null) {
    return { valid: false, reason: "invalid-merge" };
  }
  if (input.status === IDENTITY_MAP_STATUS.ACTIVE && canonicalUserId !== null) {
    return { valid: false, reason: "invalid-merge" };
  }

  const reasonCode = typeof input.reasonCode === "string" && input.reasonCode.trim() !== ""
    ? input.reasonCode.trim()
    : null;
  return {
    valid: true,
    value: {
      sourceSystem: reference.sourceSystem,
      sourceTable: reference.sourceTable,
      legacyUserId: reference.legacyUserId,
      userId: input.userId.trim(),
      status: input.status,
      canonicalUserId,
      reasonCode,
    },
  };
}
