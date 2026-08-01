import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { db } from "@/server/db/client";
import { verifyAdminPassword } from "./credentials";

export const adminSessionCookieName = "social_admin_session";

interface AdminSessionToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export interface AuthenticatedAdmin {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isSuperAdmin: boolean;
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function secureCookies(): boolean {
  return process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true";
}

function issueAdminSessionToken(persistent: boolean): AdminSessionToken {
  const raw = randomBytes(32).toString("base64url");
  const durationSeconds = persistent ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  return { raw, hash: hashSessionToken(raw), expiresAt: new Date(Date.now() + durationSeconds * 1000) };
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ ok: true; admin: AuthenticatedAdmin } | { ok: false; reason: "invalid" | "disabled" }> {
  const admin = await db.admin.findUnique({ where: { username } });
  if (!admin || !verifyAdminPassword(password, admin.passwordHash)) return { ok: false, reason: "invalid" };
  if (!admin.enabled) return { ok: false, reason: "disabled" };
  return { ok: true, admin: publicAdmin(admin) };
}

export async function establishAdminSession(adminId: string, persistent: boolean): Promise<void> {
  const admin = await db.admin.findUnique({ where: { id: adminId }, select: { id: true, enabled: true } });
  if (!admin?.enabled) return;

  const session = issueAdminSessionToken(persistent);
  await db.adminSession.create({ data: { id: session.hash, adminId: admin.id, expiresAt: session.expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, session.raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/admin",
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const token = await getAdminSessionToken();
  if (!token) return null;

  const session = await db.adminSession.findUnique({ where: { id: hashSessionToken(token) }, include: { admin: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date() || !session.admin.enabled) {
    await db.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }
  return publicAdmin(session.admin);
}

export async function destroyAdminSession(): Promise<void> {
  const token = await getAdminSessionToken();
  if (token) await db.adminSession.deleteMany({ where: { id: hashSessionToken(token) } });
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);
}

async function getAdminSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(adminSessionCookieName)?.value;
}

function publicAdmin(admin: { id: string; username: string; displayName: string; email: string; isSuperAdmin: boolean }): AuthenticatedAdmin {
  return { id: admin.id, username: admin.username, displayName: admin.displayName, email: admin.email, isSuperAdmin: admin.isSuperAdmin };
}
