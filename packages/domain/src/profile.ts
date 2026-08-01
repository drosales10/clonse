import type { FriendRelationship, PublicProfileFriend } from "./friends";
import type { PublicPresence } from "./presence";
import type { PublicProfileComment } from "./profile-comments";
import type { PublicProfileField } from "./profile-fields";

export const PROFILE_ACCESS = {
  OWNER: 1,
  FRIEND: 2,
  FRIEND_OF_FRIEND: 4,
  SUBNETWORK: 8,
  REGISTERED: 16,
  ANONYMOUS: 32,
} as const;

export const PROFILE_PRIVACY = {
  NOBODY: 0,
  OWNER_ONLY: 1,
  CONNECTIONS: 3,
  CONNECTIONS_AND_SUBNETWORK: 7,
  NETWORK: 15,
  REGISTERED: 31,
  EVERYONE: 63,
} as const;

export type ProfilePrivacy = (typeof PROFILE_PRIVACY)[keyof typeof PROFILE_PRIVACY];
export type ProfileVisibility = "public" | "private";

export interface PublicProfile {
  username: string;
  displayName: string;
  status: string | null;
  verified: boolean;
  memberSince: Date;
  presence: PublicPresence;
  visibility: ProfileVisibility;
  fields: PublicProfileField[];
  friends: PublicProfileFriend[];
  comments: PublicProfileComment[];
  canComment: boolean;
  relationship: FriendRelationship;
}

export function isProfilePrivacy(value: number): value is ProfilePrivacy {
  return Object.values(PROFILE_PRIVACY).includes(value as ProfilePrivacy);
}

export function viewerPrivacyMax(ownerId: string, viewerId: string | null, viewerIsFriend = false): number {
  if (viewerId === ownerId) return PROFILE_ACCESS.OWNER;
  if (viewerIsFriend) return PROFILE_ACCESS.FRIEND;
  return viewerId ? PROFILE_ACCESS.REGISTERED : PROFILE_ACCESS.ANONYMOUS;
}

export function canViewProfile(
  ownerId: string,
  profilePrivacy: number,
  viewerId: string | null,
  viewerIsFriend = false,
): boolean {
  if (viewerId === ownerId) return true;
  if (!isProfilePrivacy(profilePrivacy)) return false;
  return (viewerPrivacyMax(ownerId, viewerId, viewerIsFriend) & profilePrivacy) !== 0;
}

export function canCommentOnProfile(
  ownerId: string,
  commentsPrivacy: number,
  viewerId: string | null,
  viewerIsFriend = false,
): boolean {
  return canViewProfile(ownerId, commentsPrivacy, viewerId, viewerIsFriend);
}

export type ProfileSettingsField = "profilePrivacy" | "commentsPrivacy" | "status" | "form";
export type ProfileSettingsErrors = Partial<Record<ProfileSettingsField, string[]>>;

export interface ProfileSettingsInput {
  profilePrivacy: ProfilePrivacy;
  commentsPrivacy: ProfilePrivacy;
  status: string | null;
}

export interface ProfileSettingsFormState {
  errors?: ProfileSettingsErrors;
  message?: string;
  success?: boolean;
}

export function profileSettingsInputFromFormData(formData: FormData): {
  profilePrivacy: number;
  commentsPrivacy: number;
  status: string;
} {
  const rawPrivacy = formData.get("profilePrivacy");
  const rawCommentsPrivacy = formData.get("commentsPrivacy");
  const rawStatus = formData.get("status");

  return {
    profilePrivacy: typeof rawPrivacy === "string" ? Number(rawPrivacy) : Number.NaN,
    commentsPrivacy: typeof rawCommentsPrivacy === "string" ? Number(rawCommentsPrivacy) : Number.NaN,
    status: typeof rawStatus === "string" ? rawStatus.trim() : "",
  };
}

export function validateProfileSettings(input: {
  profilePrivacy: number;
  commentsPrivacy: number;
  status: string;
}):
  | { success: true; data: ProfileSettingsInput }
  | { success: false; errors: ProfileSettingsErrors } {
  const errors: ProfileSettingsErrors = {};

  if (!Number.isInteger(input.profilePrivacy) || !isProfilePrivacy(input.profilePrivacy)) {
    errors.profilePrivacy = ["Selecciona una privacidad de perfil válida."];
  }
  if (!Number.isInteger(input.commentsPrivacy) || !isProfilePrivacy(input.commentsPrivacy)) {
    errors.commentsPrivacy = ["Selecciona una privacidad de comentarios válida."];
  }

  if (Array.from(input.status).length > 100) {
    errors.status = ["El estado no puede superar los 100 caracteres."];
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : {
        success: true,
        data: {
          profilePrivacy: input.profilePrivacy as ProfilePrivacy,
          commentsPrivacy: input.commentsPrivacy as ProfilePrivacy,
          status: input.status || null,
        },
      };
}
