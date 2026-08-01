import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24;

export interface IssuedAuthToken {
  raw: string;
  hash: string;
  sentAt: Date;
}

export function issueAuthToken(): IssuedAuthToken {
  const raw = randomBytes(32).toString("base64url");
  return {
    raw,
    hash: hashAuthToken(raw),
    sentAt: new Date(),
  };
}

export function hashAuthToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function tokenMatches(raw: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashAuthToken(raw), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function tokenHasExpired(sentAt: Date, now = Date.now()): boolean {
  return sentAt.getTime() + AUTH_TOKEN_TTL_SECONDS * 1000 <= now;
}
