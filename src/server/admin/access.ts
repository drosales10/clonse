import { getCurrentAdmin } from "./session";

export type AdminAccessStatus = "configuration-required" | "unauthenticated" | "disabled" | "authenticated";

export interface AdminAccessState {
  status: AdminAccessStatus;
  message: string;
  admin?: Awaited<ReturnType<typeof getCurrentAdmin>>;
}

export async function getAdminAccessState(): Promise<AdminAccessState> {
  const admin = await getCurrentAdmin();
  if (admin) return { status: "authenticated", message: "Acceso administrativo autorizado.", admin };
  return {
    status: "unauthenticated",
    message: "No existe una sesión administrativa válida.",
  };
}

export async function requireAdminAccess(): Promise<NonNullable<AdminAccessState["admin"]>> {
  const state = await getAdminAccessState();
  if (!state.admin) throw new Error(`ADMIN_ACCESS_${state.status.toUpperCase()}`);
  return state.admin;
}
