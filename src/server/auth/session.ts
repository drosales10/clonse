import { cookies } from "next/headers";

import type { AuthenticatedUser } from "@domain/access";
import {
  createSession,
  getUserBySession,
  revokeSession,
} from "./store";

export const sessionCookieName = "social_session";

function secureCookies(): boolean {
  return process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true";
}

export async function establishSession(userId: string, persistent: boolean): Promise<void> {
  const session = await createSession(userId, persistent);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  return getUserBySession(cookieStore.get(sessionCookieName)?.value);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  await revokeSession(cookieStore.get(sessionCookieName)?.value);
  cookieStore.delete(sessionCookieName);
}
