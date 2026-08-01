import { Prisma } from "@prisma/client";

import type { BlockRelationship, BlockedUser } from "@domain/blocks";
import type {
  FriendListPagination,
  FriendRelationship,
  PublicProfileFriend,
  PublicProfileFriendsPagination,
} from "@domain/friends";
import { FRIEND_LIST_PAGE_SIZE, PUBLIC_PROFILE_FRIENDS_PAGE_SIZE } from "@domain/friends";
import type {
  ProfileFieldDefinition,
  ProfileFieldOption,
  ProfileFieldRecord,
  ProfileFieldValue,
  PublicProfileField,
} from "@domain/profile-fields";
import { isProfileFieldType } from "@domain/profile-fields";
import type { ProfileSettingsInput, PublicProfile } from "@domain/profile";
import { canCommentOnProfile, canViewProfile } from "@domain/profile";
import { presenceFromLastActiveAt } from "@domain/presence";

import { db } from "@/server/db/client";
import { updateStatusAndPrivacy } from "@/server/activity/service";
import { getProfileComments } from "@/server/profile-comments/service";
import { getPublicProfileViews, recordProfileView } from "@/server/profile-views/service";

export type ProfileLookup =
  | { kind: "profile"; profile: PublicProfile }
  | { kind: "private" }
  | { kind: "blocked"; username: string; blockedByViewer: true };

export async function getPublicProfile(
  username: string,
  viewerId: string | null,
  commentsPage = 1,
  friendsPage = 1,
  friendsSearch = "",
  mutualOnly = false,
): Promise<ProfileLookup | null> {
  const owner = await db.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      enabled: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      status: true,
      profilePrivacy: true,
      commentsPrivacy: true,
      saveProfileViews: true,
      verifiedAt: true,
      signUpDate: true,
      lastActiveAt: true,
    },
  });

  if (!owner) return null;
  const blockRelationship = viewerId ? await getBlockRelationship(viewerId, owner.id) : "none";
  if (blockRelationship === "blocked_by_target") return { kind: "private" };
  if (blockRelationship === "blocked_by_viewer") {
    return { kind: "blocked", username: owner.username, blockedByViewer: true };
  }

  const relationship = viewerId ? await getFriendRelationship(viewerId, owner.id) : "none";
  if (!canViewProfile(owner.id, owner.profilePrivacy, viewerId, relationship === "friends")) return { kind: "private" };

  const canComment = viewerId
    ? canCommentOnProfile(owner.id, owner.commentsPrivacy, viewerId, relationship === "friends")
    : false;
  await recordProfileView(owner.id, viewerId);
  const [fields, friends, commentsResult, views] = await Promise.all([
    getPublicProfileFields(owner.id),
    getPublicProfileFriends(owner.id, viewerId, friendsPage, friendsSearch, mutualOnly),
    getProfileComments(owner.id, viewerId, commentsPage),
    getPublicProfileViews(owner.id),
  ]);
  return {
    kind: "profile",
    profile: {
      username: owner.username,
      displayName: owner.displayName,
      status: owner.status,
      verified: owner.verifiedAt !== null,
      memberSince: owner.signUpDate,
      presence: presenceFromLastActiveAt(owner.lastActiveAt),
      profileViews: views.totalViews,
      visibility: "public",
      fields,
      friends: friends.items,
      friendsPagination: friends.pagination,
      comments: commentsResult.comments,
      commentsPagination: commentsResult.pagination,
      canComment,
      relationship,
    },
  };
}

export interface OwnProfileSettings {
  username: string;
  displayName: string;
  profilePrivacy: number;
  commentsPrivacy: number;
  saveProfileViews: boolean;
  status: string | null;
}

export interface BlockMutationResult {
  ok: true;
}

export interface BlockMutationFailure {
  ok: false;
  reason: "target_not_found" | "self" | "already_blocked" | "not_allowed";
}

export async function getBlockRelationship(viewerId: string, targetId: string): Promise<BlockRelationship> {
  if (viewerId === targetId) return "self";

  const blocks = await db.profileBlock.findMany({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: targetId },
        { blockerId: targetId, blockedId: viewerId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  if (blocks.some((block) => block.blockerId === viewerId)) return "blocked_by_viewer";
  if (blocks.some((block) => block.blockerId === targetId)) return "blocked_by_target";
  return "none";
}

export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const blocks = await db.profileBlock.findMany({
    where: { blockerId: userId, blocked: { enabled: true } },
    orderBy: { createdAt: "desc" },
    select: { blocked: { select: { username: true, displayName: true } } },
  });
  return blocks.map((block) => block.blocked);
}

export async function blockUser(actorId: string, targetUsername: string): Promise<BlockMutationResult | BlockMutationFailure> {
  const [actor, target] = await Promise.all([
    db.user.findUnique({ where: { id: actorId }, select: { id: true, enabled: true } }),
    findActiveUserWithProfile(targetUsername),
  ]);
  if (!actor?.enabled || !target) return { ok: false, reason: "target_not_found" };
  if (actor.id === target.id) return { ok: false, reason: "self" };

  const existing = await db.profileBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: actor.id, blockedId: target.id } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_blocked" };

  try {
    await db.$transaction([
      db.profileBlock.create({ data: { blockerId: actor.id, blockedId: target.id } }),
      db.friendConnection.deleteMany({
        where: {
          OR: [
            { requesterId: actor.id, addresseeId: target.id },
            { requesterId: target.id, addresseeId: actor.id },
          ],
        },
      }),
    ]);
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_blocked" };
    }
    throw error;
  }
}

export async function unblockUser(actorId: string, targetUsername: string): Promise<BlockMutationResult | BlockMutationFailure> {
  const target = await findActiveUserWithProfile(targetUsername);
  if (!target || target.id === actorId) return { ok: false, reason: target?.id === actorId ? "self" : "target_not_found" };

  const result = await db.profileBlock.deleteMany({
    where: { blockerId: actorId, blockedId: target.id },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

async function findActiveUserWithProfile(username: string): Promise<{ id: string } | null> {
  return db.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, enabled: true },
    select: { id: true },
  });
}
export interface FriendListItem {
  username: string;
  displayName: string;
}

export type FriendMutationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "target_not_found" | "self" | "already_friends" | "already_pending" | "not_allowed";
    };

export interface FriendDashboard {
  friends: FriendListItem[];
  friendsPagination: FriendListPagination;
  incomingRequests: FriendListItem[];
  incomingPagination: FriendListPagination;
  outgoingRequests: FriendListItem[];
  outgoingPagination: FriendListPagination;
}

export interface FriendDashboardQuery {
  friendsPage?: number;
  incomingPage?: number;
  outgoingPage?: number;
  search?: string;
}

export async function getFriendDashboard(userId: string, query: FriendDashboardQuery = {}): Promise<FriendDashboard> {
  const normalizedSearch = (query.search ?? "").trim().slice(0, 64);
  const [friends, incomingRequests, outgoingRequests] = await Promise.all([
    db.friendConnection.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        requester: { enabled: true },
        addressee: { enabled: true },
      },
      select: {
        requesterId: true,
        addresseeId: true,
        requester: { select: { username: true, displayName: true } },
        addressee: { select: { username: true, displayName: true } },
      },
    }),
    db.friendConnection.findMany({
      where: { addresseeId: userId, status: "pending", requester: { enabled: true } },
      orderBy: { createdAt: "desc" },
      select: { requester: { select: { username: true, displayName: true } } },
    }),
    db.friendConnection.findMany({
      where: { requesterId: userId, status: "pending", addressee: { enabled: true } },
      orderBy: { createdAt: "desc" },
      select: { addressee: { select: { username: true, displayName: true } } },
    }),
  ]);

  const friendItems = friends
    .map((connection) => connection.requesterId === userId ? connection.addressee : connection.requester)
    .filter((friend) => matchesFriendSearch(friend, normalizedSearch))
    .sort(compareFriendListItems);
  const incomingItems = incomingRequests.map((connection) => connection.requester);
  const outgoingItems = outgoingRequests.map((connection) => connection.addressee);

  const friendsPage = paginateFriendItems(friendItems, query.friendsPage ?? 1, normalizedSearch);
  const incomingPage = paginateFriendItems(incomingItems, query.incomingPage ?? 1, "");
  const outgoingPage = paginateFriendItems(outgoingItems, query.outgoingPage ?? 1, "");

  return {
    friends: friendsPage.items,
    friendsPagination: friendsPage.pagination,
    incomingRequests: incomingPage.items,
    incomingPagination: incomingPage.pagination,
    outgoingRequests: outgoingPage.items,
    outgoingPagination: outgoingPage.pagination,
  };
}

function matchesFriendSearch(friend: FriendListItem, search: string): boolean {
  if (!search) return true;
  const normalizedName = friend.displayName.toLocaleLowerCase("es");
  return friend.username.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    || normalizedName.includes(search.toLocaleLowerCase());
}

function paginateFriendItems<T extends FriendListItem>(items: T[], requestedPage: number, search: string): { items: T[]; pagination: FriendListPagination } {
  const pageCount = Math.max(1, Math.ceil(items.length / FRIEND_LIST_PAGE_SIZE));
  const page = normalizeFriendsPage(requestedPage, pageCount);
  const skip = (page - 1) * FRIEND_LIST_PAGE_SIZE;
  return {
    items: items.slice(skip, skip + FRIEND_LIST_PAGE_SIZE),
    pagination: {
      page,
      pageSize: FRIEND_LIST_PAGE_SIZE,
      total: items.length,
      pageCount,
      start: items.length === 0 ? 0 : skip + 1,
      end: Math.min(skip + FRIEND_LIST_PAGE_SIZE, items.length),
      search,
    },
  };
}


export async function getPublicProfileFriends(
  userId: string,
  viewerId: string | null = null,
  requestedPage = 1,
  search = "",
  mutualOnly = false,
): Promise<{ items: PublicProfileFriend[]; pagination: PublicProfileFriendsPagination }> {
  const normalizedSearch = search.trim().slice(0, 64);
  const connections = await db.friendConnection.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
      requester: { enabled: true },
      addressee: { enabled: true },
      ...(normalizedSearch ? {
        AND: [{
          OR: [
            { requester: { username: { contains: normalizedSearch, mode: "insensitive" } } },
            { requester: { displayName: { contains: normalizedSearch, mode: "insensitive" } } },
            { addressee: { username: { contains: normalizedSearch, mode: "insensitive" } } },
            { addressee: { displayName: { contains: normalizedSearch, mode: "insensitive" } } },
          ],
        }],
      } : {}),
    },
    select: {
      requesterId: true,
      addresseeId: true,
      requester: { select: { username: true, displayName: true } },
      addressee: { select: { username: true, displayName: true } },
    },
  });

  let visibleConnections = connections;
  if (mutualOnly && viewerId) {
    const viewerConnections = await db.friendConnection.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const viewerFriendIds = new Set(viewerConnections.map((connection) => connection.requesterId === viewerId ? connection.addresseeId : connection.requesterId));
    visibleConnections = connections.filter((connection) => {
      const friendId = connection.requesterId === userId ? connection.addresseeId : connection.requesterId;
      return viewerFriendIds.has(friendId);
    });
  }

  const allFriends = visibleConnections
    .map((connection) => connection.requesterId === userId ? connection.addressee : connection.requester)
    .sort(compareFriendListItems);
  const pageCount = Math.max(1, Math.ceil(allFriends.length / PUBLIC_PROFILE_FRIENDS_PAGE_SIZE));
  const page = normalizeFriendsPage(requestedPage, pageCount);
  const skip = (page - 1) * PUBLIC_PROFILE_FRIENDS_PAGE_SIZE;
  const items = allFriends.slice(skip, skip + PUBLIC_PROFILE_FRIENDS_PAGE_SIZE);

  return {
    items,
    pagination: {
      page,
      pageSize: PUBLIC_PROFILE_FRIENDS_PAGE_SIZE,
      total: allFriends.length,
      pageCount,
      start: allFriends.length === 0 ? 0 : skip + 1,
      end: skip + items.length,
      search: normalizedSearch,
      mutualOnly,
    },
  };
}

function normalizeFriendsPage(value: number, pageCount: number): number {
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, pageCount);
}

export async function getFriendRelationship(viewerId: string, targetId: string): Promise<FriendRelationship> {
  if (viewerId === targetId) return "self";

  const connections = await db.friendConnection.findMany({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: viewerId },
      ],
    },
    select: { requesterId: true, addresseeId: true, status: true },
  });

  if (connections.some((connection) => connection.status === "accepted")) return "friends";
  if (connections.some((connection) => connection.status === "pending" && connection.requesterId === targetId)) {
    return "incoming_pending";
  }
  if (connections.some((connection) => connection.status === "pending" && connection.requesterId === viewerId)) {
    return "outgoing_pending";
  }
  return "none";
}

export async function sendFriendRequest(actorId: string, targetUsername: string): Promise<FriendMutationResult> {
  const [actor, target] = await Promise.all([
    db.user.findUnique({ where: { id: actorId }, select: { id: true, enabled: true } }),
    db.user.findFirst({ where: { username: { equals: targetUsername, mode: "insensitive" }, enabled: true }, select: { id: true } }),
  ]);
  if (!actor?.enabled || !target) return { ok: false, reason: "target_not_found" };
  if (actor.id === target.id) return { ok: false, reason: "self" };

  const existing = await db.friendConnection.findMany({
    where: {
      OR: [
        { requesterId: actor.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: actor.id },
      ],
    },
    select: { status: true },
  });
  if (existing.some((connection) => connection.status === "accepted")) return { ok: false, reason: "already_friends" };
  if (existing.length > 0) return { ok: false, reason: "already_pending" };

  try {
    await db.friendConnection.create({ data: { requesterId: actor.id, addresseeId: target.id, status: "pending" } });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_pending" };
    }
    throw error;
  }
}

export async function acceptFriendRequest(actorId: string, requesterUsername: string): Promise<FriendMutationResult> {
  return updateIncomingRequest(actorId, requesterUsername, "accepted");
}

export async function rejectFriendRequest(actorId: string, requesterUsername: string): Promise<FriendMutationResult> {
  return deleteIncomingRequest(actorId, requesterUsername);
}

export async function cancelFriendRequest(actorId: string, addresseeUsername: string): Promise<FriendMutationResult> {
  const target = await findActiveUser(addresseeUsername);
  if (!target || target.id === actorId) return { ok: false, reason: target?.id === actorId ? "self" : "target_not_found" };

  const result = await db.friendConnection.deleteMany({
    where: { requesterId: actorId, addresseeId: target.id, status: "pending" },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

export async function removeFriend(actorId: string, friendUsername: string): Promise<FriendMutationResult> {
  const target = await findActiveUser(friendUsername);
  if (!target || target.id === actorId) return { ok: false, reason: target?.id === actorId ? "self" : "target_not_found" };

  const result = await db.friendConnection.deleteMany({
    where: {
      status: "accepted",
      OR: [
        { requesterId: actorId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: actorId },
      ],
    },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

async function updateIncomingRequest(
  actorId: string,
  requesterUsername: string,
  status: "accepted",
): Promise<FriendMutationResult> {
  const requester = await findActiveUser(requesterUsername);
  if (!requester || requester.id === actorId) return { ok: false, reason: requester?.id === actorId ? "self" : "target_not_found" };

  const result = await db.friendConnection.updateMany({
    where: { requesterId: requester.id, addresseeId: actorId, status: "pending" },
    data: { status },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

async function deleteIncomingRequest(actorId: string, requesterUsername: string): Promise<FriendMutationResult> {
  const requester = await findActiveUser(requesterUsername);
  if (!requester || requester.id === actorId) return { ok: false, reason: requester?.id === actorId ? "self" : "target_not_found" };

  const result = await db.friendConnection.deleteMany({
    where: { requesterId: requester.id, addresseeId: actorId, status: "pending" },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

async function findActiveUser(username: string): Promise<{ id: string } | null> {
  return db.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, enabled: true },
    select: { id: true },
  });
}

function compareFriendListItems(left: PublicProfileFriend, right: PublicProfileFriend): number {
  return left.displayName.localeCompare(right.displayName, "es", { sensitivity: "base" });
}
export async function getOwnProfileSettings(userId: string): Promise<OwnProfileSettings | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      displayName: true,
      profilePrivacy: true,
      commentsPrivacy: true,
      saveProfileViews: true,
      status: true,
    },
  });
}

export async function updateOwnProfileSettings(
  userId: string,
  input: ProfileSettingsInput,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  return updateStatusAndPrivacy(userId, input);
}

export async function getOwnProfileFields(userId: string): Promise<ProfileFieldRecord[]> {
  return getProfileFieldRecords(userId, false);
}

export async function getPublicProfileFields(userId: string): Promise<PublicProfileField[]> {
  const records = await getProfileFieldRecords(userId, true);
  return records
    .filter((record): record is ProfileFieldRecord & { value: Exclude<ProfileFieldValue, null> } => record.value !== null)
    .map((record) => ({
      categoryTitle: record.categoryTitle,
      label: record.label,
      type: record.type,
      value: record.value,
      displayMode: record.displayMode,
    }));
}

export async function updateOwnProfileFields(
  userId: string,
  values: Record<string, ProfileFieldValue>,
): Promise<{ ok: true } | { ok: false; reason: "not_found" | "invalid_field" }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "not_found" };

  const definitions = await loadProfileFieldDefinitions(false);
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  if (Object.keys(values).some((fieldId) => !definitionsById.has(fieldId))) {
    return { ok: false, reason: "invalid_field" };
  }

  for (const definition of definitions) {
    if (definition.required && (values[definition.id] === null || values[definition.id] === undefined)) {
      return { ok: false, reason: "invalid_field" };
    }
  }

  const operations = Object.entries(values).map(([fieldId, value]) => {
    if (value === null) {
      return db.profileFieldValue.deleteMany({ where: { userId, fieldId } });
    }
    return db.profileFieldValue.upsert({
      where: { userId_fieldId: { userId, fieldId } },
      create: { userId, fieldId, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  });

  if (operations.length > 0) await db.$transaction(operations);
  return { ok: true };
}

async function getProfileFieldRecords(userId: string, publicOnly: boolean): Promise<ProfileFieldRecord[]> {
  const definitions = await loadProfileFieldDefinitions(publicOnly);
  if (definitions.length === 0) return [];

  const values = await db.profileFieldValue.findMany({
    where: { userId, fieldId: { in: definitions.map((definition) => definition.id) } },
    select: { fieldId: true, value: true },
  });
  const valuesByFieldId = new Map(values.map((record) => [record.fieldId, normalizeProfileFieldValue(record.value)]));

  return definitions.map((definition) => ({
    ...definition,
    value: valuesByFieldId.get(definition.id) ?? null,
  }));
}

async function loadProfileFieldDefinitions(publicOnly: boolean): Promise<ProfileFieldDefinition[]> {
  const rows = await db.profileField.findMany({
    where: {
      active: true,
      parentFieldId: null,
      category: { active: true },
      ...(publicOnly ? { displayMode: { not: 0 } } : {}),
    },
    select: {
      id: true,
      categoryId: true,
      parentFieldId: true,
      fieldKey: true,
      label: true,
      description: true,
      type: true,
      required: true,
      maxLength: true,
      options: true,
      displayMode: true,
      validationRegex: true,
      allowHtml: true,
      category: { select: { title: true, sortOrder: true } },
      sortOrder: true,
    },
  });

  return rows
    .sort((left, right) => left.category.sortOrder - right.category.sortOrder || left.sortOrder - right.sortOrder)
    .map((row) => toProfileFieldDefinition(row))
    .filter((definition): definition is ProfileFieldDefinition => definition !== null);
}

function toProfileFieldDefinition(row: {
  id: string;
  categoryId: string;
  parentFieldId: string | null;
  fieldKey: string;
  label: string;
  description: string | null;
  type: string;
  required: boolean;
  maxLength: number | null;
  options: Prisma.JsonValue | null;
  displayMode: number;
  validationRegex: string | null;
  allowHtml: boolean;
  category: { title: string; sortOrder: number };
}): ProfileFieldDefinition | null {
  if (!isProfileFieldType(row.type)) return null;
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryTitle: row.category.title,
    parentFieldId: row.parentFieldId,
    fieldKey: row.fieldKey,
    label: row.label,
    description: row.description,
    type: row.type,
    required: row.required,
    maxLength: row.maxLength,
    options: parseProfileFieldOptions(row.options),
    displayMode: row.displayMode,
    validationRegex: row.validationRegex,
    allowHtml: row.allowHtml,
  };
}

function parseProfileFieldOptions(value: Prisma.JsonValue | null): ProfileFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option): ProfileFieldOption[] => {
    if (!option || typeof option !== "object" || Array.isArray(option)) return [];
    const candidate = option as { value?: unknown; label?: unknown };
    return typeof candidate.value === "string" && typeof candidate.label === "string"
      ? [{ value: candidate.value, label: candidate.label }]
      : [];
  });
}

function normalizeProfileFieldValue(value: Prisma.JsonValue): ProfileFieldValue {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string[];
  return null;
}
