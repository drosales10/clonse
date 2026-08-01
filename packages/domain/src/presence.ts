export const PRESENCE_WINDOW_MS = 10 * 60 * 1000;

export type PresenceStatus = "online" | "offline";

export interface PublicPresence {
  status: PresenceStatus;
}

export function presenceFromLastActiveAt(
  lastActiveAt: Date | null,
  now: Date = new Date(),
): PublicPresence {
  if (!lastActiveAt) return { status: "offline" };

  const age = now.getTime() - lastActiveAt.getTime();
  return age >= 0 && age <= PRESENCE_WINDOW_MS
    ? { status: "online" }
    : { status: "offline" };
}
