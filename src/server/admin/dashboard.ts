import { db } from "@/server/db/client";

export interface AdminDashboardStats {
  totalUsers: number;
  enabledUsers: number;
  verifiedUsers: number;
  totalLevels: number;
  totalSubnetworks: number;
  totalSettings: number;
  totalLanguageVariables: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [totalUsers, enabledUsers, verifiedUsers, totalLevels, totalSubnetworks, totalSettings, totalLanguageVariables] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { enabled: true } }),
    db.user.count({ where: { verifiedAt: { not: null } } }),
    db.userLevel.count(),
    db.subnetwork.count(),
    db.setting.count(),
    db.languageVariable.count(),
  ]);

  return { totalUsers, enabledUsers, verifiedUsers, totalLevels, totalSubnetworks, totalSettings, totalLanguageVariables };
}
