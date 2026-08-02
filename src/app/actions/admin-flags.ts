"use server";

import { revalidatePath } from "next/cache";

import {
  adminModuleFlagsFromFormData,
  requiresFlagsConfirmation,
  type AdminModuleFlagsFormState,
  type AdminModuleKind,
} from "@domain/admin-flags";

import { requireAdminAccess } from "@/server/admin/access";
import { recordAdminAuditLog } from "@/server/admin/audit-log";
import {
  adminModuleRevalidatePaths,
  getAdminModuleFlags,
  updateAdminModuleFlags,
} from "@/server/admin/module-flags";

const FLAG_ERRORS: Record<string, string> = {
  not_found: "No se encontró el recurso.",
  invalid_privacy: "Valor de privacidad no válido.",
};

export async function adminUpdateModuleFlagsAction(
  _previous: AdminModuleFlagsFormState,
  formData: FormData,
): Promise<AdminModuleFlagsFormState> {
  const admin = await requireAdminAccess();
  const kind = String(formData.get("kind") ?? "").trim() as AdminModuleKind;
  const resourceId = String(formData.get("resourceId") ?? "").trim();
  const confirmed = formData.get("confirmed") === "1";

  if (!resourceId || !kind) {
    return { errors: { form: ["Recurso no válido."] } };
  }

  const current = await getAdminModuleFlags(kind, resourceId);
  if (!current) return { errors: { form: ["No se encontró el recurso."] } };

  const nextValues = adminModuleFlagsFromFormData(kind, formData);
  if (requiresFlagsConfirmation(kind, current.values, nextValues) && !confirmed) {
    return {
      errors: {
        form: ["Confirma que deseas ocultar o desactivar flags sensibles marcando la casilla de confirmación."],
      },
    };
  }

  try {
    const result = await updateAdminModuleFlags(kind, resourceId, nextValues);
    if (!result.ok) {
      return { errors: { form: [FLAG_ERRORS[result.reason] ?? "No se pudieron guardar los flags."] } };
    }

    const changeCount = Object.keys(result.changes).length;
    if (changeCount > 0) {
      await recordAdminAuditLog({
        adminId: admin.id,
        resourceKind: kind,
        resourceId,
        summary: `${changeCount} flag(s) actualizado(s)`,
        changes: result.changes,
      });
    }

    for (const path of adminModuleRevalidatePaths(kind, resourceId)) {
      revalidatePath(path);
    }

    return {
      success: true,
      message: changeCount > 0 ? "Flags actualizados correctamente." : "No hubo cambios.",
    };
  } catch {
    return { errors: { form: ["No se pudieron guardar los flags."] } };
  }
}
