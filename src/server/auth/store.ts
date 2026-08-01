import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { Prisma } from "@prisma/client";

import type { AuthenticatedUser, LoginInput, RegisterInput } from "@domain/access";
import { db } from "@/server/db/client";
import { issueAuthToken, hashAuthToken, tokenHasExpired, tokenMatches } from "./token-service";

interface StoredSessionResult {
  token: string;
  expiresAt: Date;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, encodedHash: string): boolean {
  const [, saltHex, keyHex] = encodedHash.split(":");
  if (!saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createUser(
  input: RegisterInput,
): Promise<
  | { ok: true; user: AuthenticatedUser; verificationToken: string }
  | { ok: false; reason: "email_taken" | "username_taken" }
> {
  const existing = await db.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true, username: true },
  });

  if (existing?.email === input.email) return { ok: false, reason: "email_taken" };
  if (existing?.username.toLowerCase() === input.username.toLowerCase()) {
    return { ok: false, reason: "username_taken" };
  }

  try {
    const result = await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: input.email,
          username: input.username,
          displayName: input.username,
          passwordHash: hashPassword(input.password),
          verifiedAt: null,
        },
      });
      const verificationToken = issueAuthToken();
      await transaction.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash: verificationToken.hash,
          verificationSentAt: verificationToken.sentAt,
        },
      });
      return { user, verificationToken: verificationToken.raw };
    });

    return {
      ok: true,
      user: publicUser(result.user),
      verificationToken: result.verificationToken,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      return target.includes("email")
        ? { ok: false, reason: "email_taken" }
        : { ok: false, reason: "username_taken" };
    }
    throw error;
  }
}

export async function authenticateUser(
  input: LoginInput,
): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; reason: "invalid" | "disabled" | "unverified" }> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) return { ok: false, reason: "invalid" };
  if (!user.enabled) return { ok: false, reason: "disabled" };
  if (!user.verifiedAt) return { ok: false, reason: "unverified" };

  const now = new Date();
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: now, lastActiveAt: now, loginCount: { increment: 1 } },
  });

  return { ok: true, user: publicUser(updatedUser) };
}

export async function createSession(userId: string, persistent: boolean): Promise<StoredSessionResult> {
  const token = randomBytes(32).toString("base64url");
  const durationSeconds = persistent ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  await db.authSession.create({ data: { id: token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getUserBySession(token: string | undefined): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const session = await db.authSession.findUnique({ where: { id: token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.authSession.delete({ where: { id: token } });
    return null;
  }
  if (!session.user.enabled || !session.user.verifiedAt) return null;

  const now = new Date();
  if (!session.user.lastActiveAt || now.getTime() - session.user.lastActiveAt.getTime() >= 2 * 60 * 1000) {
    await db.user.update({ where: { id: session.user.id }, data: { lastActiveAt: now } });
  }

  return publicUser(session.user);
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (token) await db.authSession.deleteMany({ where: { id: token } });
}

export async function resendVerification(email: string): Promise<{ verificationToken?: string }> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, verifiedAt: true } });
  if (!user || user.verifiedAt) return {};

  const token = issueAuthToken();
  await db.user.update({
    where: { id: user.id },
    data: { verificationTokenHash: token.hash, verificationSentAt: token.sentAt },
  });
  return { verificationToken: token.raw };
}

export async function verifyUserEmail(
  rawToken: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  const tokenHash = await findTokenUserId("verification", rawToken);
  if (!tokenHash) return { ok: false, reason: "invalid" };

  const user = await db.user.findUnique({
    where: { id: tokenHash },
    select: { id: true, verificationTokenHash: true, verificationSentAt: true, verifiedAt: true },
  });
  if (!user?.verificationTokenHash || !user.verificationSentAt || !tokenMatches(rawToken, user.verificationTokenHash)) {
    return { ok: false, reason: "invalid" };
  }
  if (tokenHasExpired(user.verificationSentAt)) {
    await db.user.update({ where: { id: user.id }, data: { verificationTokenHash: null, verificationSentAt: null } });
    return { ok: false, reason: "expired" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { verifiedAt: new Date(), verificationTokenHash: null, verificationSentAt: null },
  });
  return { ok: true };
}

export async function requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, enabled: true } });
  if (!user || !user.enabled) return {};

  const token = issueAuthToken();
  await db.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: token.hash, passwordResetSentAt: token.sentAt },
  });
  return { resetToken: token.raw };
}

export async function resetUserPassword(
  rawToken: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  const userId = await findTokenUserId("password_reset", rawToken);
  if (!userId) return { ok: false, reason: "invalid" };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordResetTokenHash: true, passwordResetSentAt: true },
  });
  if (!user?.passwordResetTokenHash || !user.passwordResetSentAt || !tokenMatches(rawToken, user.passwordResetTokenHash)) {
    return { ok: false, reason: "invalid" };
  }
  if (tokenHasExpired(user.passwordResetSentAt)) {
    await db.user.update({ where: { id: user.id }, data: { passwordResetTokenHash: null, passwordResetSentAt: null } });
    return { ok: false, reason: "expired" };
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password), passwordResetTokenHash: null, passwordResetSentAt: null },
    }),
    db.authSession.deleteMany({ where: { userId: user.id } }),
  ]);
  return { ok: true };
}

async function findTokenUserId(kind: "verification" | "password_reset", rawToken: string): Promise<string | null> {
  const tokenHash = hashAuthToken(rawToken);
  if (kind === "verification") {
    const user = await db.user.findFirst({
      where: { verificationTokenHash: tokenHash },
      select: { id: true, verificationTokenHash: true },
    });
    return user?.verificationTokenHash && tokenMatches(rawToken, user.verificationTokenHash) ? user.id : null;
  }

  const user = await db.user.findFirst({
    where: { passwordResetTokenHash: tokenHash },
    select: { id: true, passwordResetTokenHash: true },
  });
  return user?.passwordResetTokenHash && tokenMatches(rawToken, user.passwordResetTokenHash) ? user.id : null;
}

function publicUser(user: { id: string; email: string; username: string; displayName: string }): AuthenticatedUser {
  return { id: user.id, email: user.email, username: user.username, displayName: user.displayName };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionToken?: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid_current" | "not_found" }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, enabled: true, verifiedAt: true, passwordHash: true },
  });
  if (!user?.enabled || !user.verifiedAt) return { ok: false, reason: "not_found" };
  if (!verifyPassword(currentPassword, user.passwordHash)) return { ok: false, reason: "invalid_current" };

  await db.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });
    await transaction.authSession.deleteMany({
      where: {
        userId: user.id,
        ...(currentSessionToken ? { id: { not: currentSessionToken } } : {}),
      },
    });
  });
  return { ok: true };
}
