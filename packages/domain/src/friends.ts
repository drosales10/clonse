export const FRIEND_CONNECTION_STATUSES = ["pending", "accepted"] as const;

export type FriendConnectionStatus = (typeof FRIEND_CONNECTION_STATUSES)[number];
export type FriendRelationship = "self" | "friends" | "incoming_pending" | "outgoing_pending" | "none";

export interface PublicProfileFriend {
  username: string;
  displayName: string;
}

export interface FriendActionState {
  errors?: { form?: string[] };
  message?: string;
  success?: boolean;
}

export function friendTargetFromFormData(formData: FormData): string {
  const value = formData.get("username");
  return typeof value === "string" ? value.trim() : "";
}

export function validateFriendTarget(username: string): string | null {
  if (!username) return "No se ha indicado el usuario de destino.";
  if (username.length > 64 || !/^[A-Za-z0-9]+$/.test(username)) {
    return "El usuario de destino no es válido.";
  }
  return null;
}

export function isFriendConnectionStatus(value: string): value is FriendConnectionStatus {
  return FRIEND_CONNECTION_STATUSES.includes(value as FriendConnectionStatus);
}
