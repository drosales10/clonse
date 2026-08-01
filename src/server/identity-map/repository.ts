import { db } from "@/server/db/client";
import {
  normalizeLegacyUserReference,
  resolveIdentityMapping,
  type LegacyUserReference,
  type LegacyUserReferenceResult,
} from "@domain/identity-map";

export async function resolveLegacyUserReference(
  input: Partial<LegacyUserReference>,
): Promise<LegacyUserReferenceResult> {
  const normalized = normalizeLegacyUserReference(input);
  if ("kind" in normalized) return normalized;

  const mapping = await db.userIdentityMap.findUnique({
    where: {
      sourceSystem_sourceTable_legacyUserId: {
        sourceSystem: normalized.sourceSystem,
        sourceTable: normalized.sourceTable,
        legacyUserId: normalized.legacyUserId,
      },
    },
    select: { status: true, userId: true, canonicalUserId: true },
  });

  if (!mapping) return { kind: "missing-reference" };
  return resolveIdentityMapping(mapping.status, mapping.userId, mapping.canonicalUserId);
}
