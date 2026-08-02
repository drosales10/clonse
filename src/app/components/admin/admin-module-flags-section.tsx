import type { AdminModuleKind } from "@domain/admin-flags";

import { AdminModuleFlagsPanel } from "@/app/components/admin/admin-module-flags-panel";
import { listAdminAuditLogs } from "@/server/admin/audit-log";
import { getAdminModuleFlags } from "@/server/admin/module-flags";

export async function AdminModuleFlagsSection({
  kind,
  resourceId,
}: {
  kind: AdminModuleKind;
  resourceId: string;
}) {
  const snapshot = await getAdminModuleFlags(kind, resourceId);
  if (!snapshot) return null;

  const audit = await listAdminAuditLogs(kind, resourceId, 5);

  return (
    <AdminModuleFlagsPanel
      audit={audit.map((entry) => ({
        id: entry.id,
        summary: entry.summary,
        createdAt: entry.createdAt.toISOString(),
        admin: entry.admin,
      }))}
      snapshot={snapshot}
    />
  );
}
