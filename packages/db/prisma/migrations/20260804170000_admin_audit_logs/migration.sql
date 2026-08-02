-- Minimal audit trail for admin flag changes.
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "resource_kind" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_resource_kind_resource_id_created_at_idx"
    ON "admin_audit_logs"("resource_kind", "resource_id", "created_at");
CREATE INDEX "admin_audit_logs_admin_id_created_at_idx"
    ON "admin_audit_logs"("admin_id", "created_at");
