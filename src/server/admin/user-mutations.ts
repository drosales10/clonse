import { db } from "@/server/db/client";

export type AdminUserMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

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
