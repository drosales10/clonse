import { db } from "@/server/db/client";

export interface AdminDashboardStats {
  totalUsers: number;
  enabledUsers: number;
  verifiedUsers: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [totalUsers, enabledUsers, verifiedUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { enabled: true } }),
    db.user.count({ where: { verifiedAt: { not: null } } }),
  ]);

  return { totalUsers, enabledUsers, verifiedUsers };
}
