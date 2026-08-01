export const FRIEND_CONNECTION_STATUSES = ["pending", "accepted"] as const;
export const FRIEND_LIST_PAGE_SIZE = 10;
export const PUBLIC_PROFILE_FRIENDS_PAGE_SIZE = 10;
export const PEOPLE_DIRECTORY_PAGE_SIZE = 20;

export type FriendConnectionStatus = (typeof FRIEND_CONNECTION_STATUSES)[number];
export type FriendRelationship = "self" | "friends" | "incoming_pending" | "outgoing_pending" | "none";

export interface PeopleDirectoryItem {
  username: string;
  displayName: string;
  relationship: Exclude<FriendRelationship, "self">;
}

export interface PeopleDirectoryPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
  search: string;
}

export interface PeopleDirectoryResult {
  items: PeopleDirectoryItem[];
  pagination: PeopleDirectoryPagination;
}

export interface PublicProfileFriend {
  username: string;
  displayName: string;
}

export interface PublicProfileFriendsPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
  search: string;
  mutualOnly: boolean;
}

export interface FriendListPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
  search: string;
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
