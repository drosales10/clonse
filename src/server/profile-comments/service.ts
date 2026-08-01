import type { PublicProfileComment, ProfileCommentsPagination } from "@domain/profile-comments";
import { PROFILE_COMMENT_PAGE_SIZE } from "@domain/profile-comments";
import { canCommentOnProfile, canViewProfile } from "@domain/profile";
import { NOTIFICATION_LEGACY_PROFILE_COMMENT_TYPE, NOTIFICATION_TYPE_PROFILE_COMMENT } from "@domain/notifications";
import { db } from "@/server/db/client";

export type ProfileCommentMutationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "not_allowed" | "invalid_comment";
    };

export async function getProfileComments(
  ownerId: string,
  viewerId: string | null,
  requestedPage = 1,
): Promise<{ comments: PublicProfileComment[]; pagination: ProfileCommentsPagination }> {
  const where = { profileOwnerId: ownerId, author: { enabled: true } };
  const total = await db.profileComment.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PROFILE_COMMENT_PAGE_SIZE));
  const page = normalizePage(requestedPage, pageCount);
  const skip = (page - 1) * PROFILE_COMMENT_PAGE_SIZE;
  const comments = await db.profileComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PROFILE_COMMENT_PAGE_SIZE,
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorId: true,
      profileOwnerId: true,
      author: { select: { username: true, displayName: true } },
    },
  });

  return {
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.author,
      canEdit: viewerId === comment.authorId,
      canDelete: viewerId === comment.authorId || viewerId === comment.profileOwnerId,
    })),
    pagination: {
      page,
      pageSize: PROFILE_COMMENT_PAGE_SIZE,
      total,
      pageCount,
      start: total === 0 ? 0 : skip + 1,
      end: skip + comments.length,
    },
  };
}

function normalizePage(value: number, pageCount: number): number {
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, pageCount);
}

export async function createProfileCommentWithNotification(
  actorId: string,
  ownerUsername: string,
  body: string,
): Promise<ProfileCommentMutationResult> {
  const [actor, owner] = await Promise.all([
    db.user.findUnique({ where: { id: actorId }, select: { id: true, enabled: true, verifiedAt: true } }),
    findActiveUser(ownerUsername),
  ]);
  if (!actor?.enabled || !actor.verifiedAt || !owner) return { ok: false, reason: "not_found" };

  const access = await getProfileCommentAccess(actor.id, owner.id, owner.profilePrivacy, owner.commentsPrivacy);
  if (!access) return { ok: false, reason: "not_allowed" };

  const commentData = { profileOwnerId: owner.id, authorId: actor.id, body };
  await db.$transaction(async (transaction) => {
    await transaction.profileComment.create({ data: commentData });
    if (actor.id !== owner.id) {
      await transaction.notification.create({
        data: {
          recipientId: owner.id,
          actorId: actor.id,
          profileOwnerId: owner.id,
          type: NOTIFICATION_TYPE_PROFILE_COMMENT,
          legacyTypeId: NOTIFICATION_LEGACY_PROFILE_COMMENT_TYPE,
          objectId: owner.id,
        },
      });
    }
  });
  return { ok: true };
}

export async function updateProfileComment(
  actorId: string,
  ownerUsername: string,
  commentId: string,
  body: string,
): Promise<ProfileCommentMutationResult> {
  const owner = await findActiveUser(ownerUsername);
  if (!owner) return { ok: false, reason: "not_found" };

  const result = await db.profileComment.updateMany({
    where: { id: commentId, profileOwnerId: owner.id, authorId: actorId },
    data: { body },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

export async function deleteProfileComment(
  actorId: string,
  ownerUsername: string,
  commentId: string,
): Promise<ProfileCommentMutationResult> {
  const owner = await findActiveUser(ownerUsername);
  if (!owner) return { ok: false, reason: "not_found" };

  const result = await db.profileComment.deleteMany({
    where: {
      id: commentId,
      profileOwnerId: owner.id,
      OR: [{ authorId: actorId }, { profileOwnerId: actorId }],
    },
  });
  return result.count > 0 ? { ok: true } : { ok: false, reason: "not_allowed" };
}

async function findActiveUser(username: string): Promise<{
  id: string;
  profilePrivacy: number;
  commentsPrivacy: number;
} | null> {
  return db.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, enabled: true },
    select: { id: true, profilePrivacy: true, commentsPrivacy: true },
  });
}

async function getProfileCommentAccess(
  actorId: string,
  ownerId: string,
  profilePrivacy: number,
  commentsPrivacy: number,
): Promise<boolean> {
  if (actorId === ownerId) return true;

  const [block, friendship] = await Promise.all([
    db.profileBlock.findFirst({
      where: {
        OR: [
          { blockerId: actorId, blockedId: ownerId },
          { blockerId: ownerId, blockedId: actorId },
        ],
      },
      select: { id: true },
    }),
    db.friendConnection.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: actorId, addresseeId: ownerId },
          { requesterId: ownerId, addresseeId: actorId },
        ],
      },
      select: { id: true },
    }),
  ]);
  if (block) return false;

  const isFriend = friendship !== null;
  return canViewProfile(ownerId, profilePrivacy, actorId, isFriend)
    && canCommentOnProfile(ownerId, commentsPrivacy, actorId, isFriend);
}
