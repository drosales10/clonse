import { PROFILE_VIEWER_LIMIT, type ProfileViewStats, type PublicProfileViews } from "@domain/profile-views";

import { db } from "@/server/db/client";

export async function recordProfileView(profileOwnerId: string, viewerId: string | null): Promise<void> {
  if (viewerId === profileOwnerId) return;

  const owner = await db.user.findUnique({
    where: { id: profileOwnerId },
    select: { id: true, enabled: true, saveProfileViews: true },
  });
  if (!owner?.enabled) return;

  await db.$transaction(async (transaction) => {
    const stats = await transaction.profileViewStats.upsert({
      where: { profileOwnerId: owner.id },
      create: { profileOwnerId: owner.id, totalViews: 1 },
      update: { totalViews: { increment: 1 } },
      select: { id: true },
    });

    if (!viewerId || !owner.saveProfileViews) return;

    const viewer = await transaction.user.findUnique({
      where: { id: viewerId },
      select: { id: true, enabled: true },
    });
    if (!viewer?.enabled) return;

    await transaction.profileViewViewer.upsert({
      where: { statsId_viewerId: { statsId: stats.id, viewerId: viewer.id } },
      create: { statsId: stats.id, viewerId: viewer.id },
      update: { viewedAt: new Date() },
    });

    const stale = await transaction.profileViewViewer.findMany({
      where: { statsId: stats.id },
      orderBy: [{ viewedAt: "desc" }, { id: "desc" }],
      skip: PROFILE_VIEWER_LIMIT,
      select: { id: true },
    });
    if (stale.length > 0) {
      await transaction.profileViewViewer.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
    }
  });
}

export async function getPublicProfileViews(profileOwnerId: string): Promise<PublicProfileViews> {
  const stats = await db.profileViewStats.findUnique({
    where: { profileOwnerId },
    select: { totalViews: true },
  });
  return { totalViews: stats?.totalViews ?? 0 };
}

export async function getOwnProfileViews(profileOwnerId: string): Promise<ProfileViewStats | null> {
  const owner = await db.user.findUnique({
    where: { id: profileOwnerId },
    select: { id: true, saveProfileViews: true },
  });
  if (!owner) return null;

  const stats = await db.profileViewStats.findUnique({
    where: { profileOwnerId },
    select: {
      totalViews: true,
      viewers: {
        where: { viewer: { enabled: true } },
        orderBy: [{ viewedAt: "desc" }, { id: "desc" }],
        take: PROFILE_VIEWER_LIMIT,
        select: { viewer: { select: { username: true, displayName: true } } },
      },
    },
  });

  return {
    totalViews: stats?.totalViews ?? 0,
    viewers: owner.saveProfileViews ? stats?.viewers.map((row) => row.viewer) ?? [] : [],
  };
}

export async function resetOwnProfileViews(profileOwnerId: string): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const owner = await db.user.findUnique({ where: { id: profileOwnerId }, select: { id: true } });
  if (!owner) return { ok: false, reason: "not_found" };

  await db.$transaction(async (transaction) => {
    await transaction.profileViewViewer.deleteMany({ where: { stats: { profileOwnerId } } });
    await transaction.profileViewStats.updateMany({ where: { profileOwnerId }, data: { totalViews: 0 } });
  });
  return { ok: true };
}
