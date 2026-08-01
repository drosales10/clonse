import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { Prisma } from "@prisma/client";

import type { AuthenticatedUser, LoginInput, RegisterInput } from "@domain/access";
import { db } from "@/server/db/client";

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
): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; reason: "email_taken" | "username_taken" }> {
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
    select: { email: true, username: true },
  });

  if (existing?.email === input.email) return { ok: false, reason: "email_taken" };
  if (existing?.username.toLowerCase() === input.username.toLowerCase()) {
    return { ok: false, reason: "username_taken" };
  }

  try {
    const user = await db.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.username,
        passwordHash: hashPassword(input.password),
        // This local phase has no mail adapter; the verification workflow remains pending.
        verifiedAt: new Date(),
      },
    });

    return { ok: true, user: publicUser(user) };
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
    data: {
      lastLoginAt: now,
      lastActiveAt: now,
      loginCount: { increment: 1 },
    },
  });

  return { ok: true, user: publicUser(updatedUser) };
}

export async function createSession(userId: string, persistent: boolean): Promise<StoredSessionResult> {
  const token = randomBytes(32).toString("base64url");
  const durationSeconds = persistent ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  await db.authSession.create({
    data: {
      id: token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserBySession(token: string | undefined): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  const session = await db.authSession.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await db.authSession.delete({ where: { id: token } });
    return null;
  }

  if (!session.user.enabled || !session.user.verifiedAt) return null;
  return publicUser(session.user);
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.authSession.deleteMany({ where: { id: token } });
}

function publicUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
  };
}
