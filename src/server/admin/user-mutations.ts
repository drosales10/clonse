import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";

export type AdminUserMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "invalid_level" | "invalid_subnetwork" | "has_content" };

export async function setAdminUserEnabled(
  userId: string,
  enabled: boolean,
): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };
  await db.user.update({ where: { id: user.id }, data: { enabled } });
  if (!enabled) {
    await db.authSession.deleteMany({ where: { userId: user.id } });
  }
  return { ok: true };
}

export async function setAdminUserVerified(
  userId: string,
  verified: boolean,
): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };
  await db.user.update({
    where: { id: user.id },
    data: verified
      ? {
          verifiedAt: new Date(),
          verificationTokenHash: null,
          verificationSentAt: null,
        }
      : {
          verifiedAt: null,
        },
  });
  return { ok: true };
}

export async function resetAdminUserPassword(
  userId: string,
  password: string,
): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        passwordResetTokenHash: null,
        passwordResetSentAt: null,
      },
    }),
    db.authSession.deleteMany({ where: { userId: user.id } }),
  ]);
  return { ok: true };
}

export async function setAdminUserLevel(
  userId: string,
  levelId: string | null,
): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };
  if (levelId) {
    const level = await db.userLevel.findUnique({ where: { id: levelId }, select: { id: true } });
    if (!level) return { ok: false, reason: "invalid_level" };
  }
  await db.user.update({ where: { id: user.id }, data: { levelId } });
  return { ok: true };
}

export async function setAdminUserSubnetwork(
  userId: string,
  subnetworkId: string | null,
): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };
  if (subnetworkId) {
    const subnetwork = await db.subnetwork.findUnique({
      where: { id: subnetworkId },
      select: { id: true },
    });
    if (!subnetwork) return { ok: false, reason: "invalid_subnetwork" };
  }
  await db.user.update({ where: { id: user.id }, data: { subnetworkId } });
  return { ok: true };
}

async function countUserOwnedContent(userId: string): Promise<number> {
  const [
    businesses,
    classifieds,
    events,
    groups,
    blogEntries,
    articles,
    forumPosts,
    albums,
    polls,
    identityMaps,
  ] = await Promise.all([
    db.business.count({ where: { ownerId: userId } }),
    db.classified.count({ where: { ownerId: userId } }),
    db.event.count({ where: { ownerId: userId } }),
    db.group.count({ where: { ownerId: userId } }),
    db.blogEntry.count({ where: { authorId: userId } }),
    db.article.count({ where: { authorId: userId } }),
    db.forumPost.count({ where: { authorId: userId } }),
    db.album.count({ where: { ownerId: userId } }),
    db.poll.count({ where: { ownerId: userId } }),
    db.userIdentityMap.count({ where: { userId } }),
  ]);
  return (
    businesses +
    classifieds +
    events +
    groups +
    blogEntries +
    articles +
    forumPosts +
    albums +
    polls +
    identityMaps
  );
}

export async function deleteAdminUser(userId: string): Promise<AdminUserMutationResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };

  const ownedContent = await countUserOwnedContent(userId);
  if (ownedContent > 0) return { ok: false, reason: "has_content" };

  await db.$transaction([
    db.authSession.deleteMany({ where: { userId: user.id } }),
    db.user.delete({ where: { id: user.id } }),
  ]);
  return { ok: true };
}
