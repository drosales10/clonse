import type { Prisma } from "@prisma/client";

import { db } from "@/server/db/client";

export interface AdminAuditEntry {
  id: string;
  summary: string;
  changes: Record<string, unknown>;
  createdAt: Date;
  admin: { username: string; displayName: string };
}

function asChangeRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function recordAdminAuditLog(input: {
  adminId: string;
  resourceKind: string;
  resourceId: string;
  summary: string;
  changes: Record<string, unknown>;
}): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      resourceKind: input.resourceKind,
      resourceId: input.resourceId,
      summary: input.summary,
      changes: input.changes as Prisma.InputJsonValue,
    },
  });
}

export async function listAdminAuditLogs(
  resourceKind: string,
  resourceId: string,
  limit = 5,
): Promise<AdminAuditEntry[]> {
  const rows = await db.adminAuditLog.findMany({
    where: { resourceKind, resourceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      summary: true,
      changes: true,
      createdAt: true,
      admin: { select: { username: true, displayName: true } },
    },
  });

  return rows.map((row) => ({
    ...row,
    changes: asChangeRecord(row.changes),
  }));
}
