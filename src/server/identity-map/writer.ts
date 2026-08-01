import { Prisma } from "@prisma/client";

import {
  validateApprovedIdentityMapping,
  type ApprovedIdentityMapping,
} from "@domain/identity-map";
import { db } from "@/server/db/client";

export type IdentityMappingWriteResult =
  | { kind: "created" }
  | { kind: "unchanged" }
  | { kind: "invalid"; reason: string }
  | { kind: "conflict"; reason: "legacy-reference-already-mapped" | "destination-already-mapped" | "concurrent-write" };

export async function writeApprovedIdentityMapping(
  input: Partial<ApprovedIdentityMapping>,
): Promise<IdentityMappingWriteResult> {
  const validation = validateApprovedIdentityMapping(input);
  if (!validation.valid) return { kind: "invalid", reason: validation.reason };
  const mapping = validation.value;

  try {
    return await db.$transaction(async (transaction) => {
      const destination = await transaction.user.findUnique({
        where: { id: mapping.userId },
        select: { id: true },
      });
      if (!destination) return { kind: "invalid", reason: "destination-user-not-found" };

      if (mapping.status === "merged") {
        const canonical = await transaction.user.findUnique({
          where: { id: mapping.canonicalUserId as string },
          select: { id: true },
        });
        if (!canonical) return { kind: "invalid", reason: "canonical-user-not-found" };
        if (canonical.id === mapping.userId) return { kind: "invalid", reason: "canonical-user-equals-source" };
      }

      const existing = await transaction.userIdentityMap.findUnique({
        where: {
          sourceSystem_sourceTable_legacyUserId: {
            sourceSystem: mapping.sourceSystem,
            sourceTable: mapping.sourceTable,
            legacyUserId: mapping.legacyUserId,
          },
        },
        select: {
          userId: true,
          sourceSystem: true,
          sourceTable: true,
          legacyUserId: true,
          status: true,
          canonicalUserId: true,
          reasonCode: true,
        },
      });

      if (existing) {
        if (sameMapping(existing, mapping)) return { kind: "unchanged" };
        return { kind: "conflict", reason: "legacy-reference-already-mapped" };
      }

      const destinationMapping = await transaction.userIdentityMap.findUnique({
        where: {
          userId_sourceSystem_sourceTable: {
            userId: mapping.userId,
            sourceSystem: mapping.sourceSystem,
            sourceTable: mapping.sourceTable,
          },
        },
        select: { legacyUserId: true },
      });
      if (destinationMapping) return { kind: "conflict", reason: "destination-already-mapped" };

      await transaction.userIdentityMap.create({
        data: {
          userId: mapping.userId,
          sourceSystem: mapping.sourceSystem,
          sourceTable: mapping.sourceTable,
          legacyUserId: mapping.legacyUserId,
          status: mapping.status,
          canonicalUserId: mapping.canonicalUserId,
          reasonCode: mapping.reasonCode,
          importedAt: new Date(),
        },
      });
      return { kind: "created" };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { kind: "conflict", reason: "concurrent-write" };
    }
    throw error;
  }
}

function sameMapping(
  existing: {
    userId: string;
    sourceSystem: string;
    sourceTable: string;
    legacyUserId: number;
    status: string;
    canonicalUserId: string | null;
    reasonCode: string | null;
  },
  mapping: ApprovedIdentityMapping,
): boolean {
  return existing.userId === mapping.userId
    && existing.sourceSystem === mapping.sourceSystem
    && existing.sourceTable === mapping.sourceTable
    && existing.legacyUserId === mapping.legacyUserId
    && existing.status === mapping.status
    && existing.canonicalUserId === mapping.canonicalUserId
    && existing.reasonCode === mapping.reasonCode;
}
